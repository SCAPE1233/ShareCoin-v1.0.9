// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShareCoin
 * @notice Single contract that:
 *   1) Is an ERC20 token (21M max supply),
 *   2) Allows day-based subscriptions (Basic/Standard/Premium) or a limited-lifetime plan,
 *   3) Provides both user-based and server-based mining calls.
 */
contract ShareCoin is ERC20, Ownable, ReentrancyGuard {
    // --------------------------
    // 1) ERC20 Setup
    // --------------------------
    uint256 public constant MAX_SUPPLY   = 21_000_000 * 10**18; // 21M max
    uint256 public constant BLOCK_REWARD = 50 * 10**18;         // 50 SHARE per block

    // Payment token (e.g. USDC, TDAI, etc.) used for subscriptions
    ERC20 public paymentToken;

    // Example token logo URL
    string public tokenLogoURI;

    // (Optional) difficulty-related settings
    uint256 public defaultDifficulty = 0;
    uint256 public confirmationThreshold = 0;

    // --------------------------
    // 2) Subscription Management
    // --------------------------
    enum PlanType { None, Basic, Standard, Premium, Lifetime }

    // user => subscription expiry (timestamp)
    mapping(address => uint256) public subscriptions;
    // user => last plan purchased
    mapping(address => PlanType) public userPlan;

    // Lifetime plan limit
    uint256 public lifetimeLimit = 50;
    uint256 public lifetimeSold;

    // Hard-coded daily rates
    uint256 public basicDailyRate    = 20  * 10**18;
    uint256 public standardDailyRate = 40  * 10**18;
    uint256 public premiumDailyRate  = 60  * 10**18;
    uint256 public lifetimePrice     = 8000 * 10**18;

    // Events
    event SubscriptionPurchased(address indexed user, PlanType plan, uint256 expiry);
    event LifetimeSubscriptionPurchased(address indexed user);
    event WithdrawnSubscriptionFunds(uint256 amount);
    event DifficultySet(uint256 difficulty);

    // --------------------------
    // 3) Mined Block Storage
    // --------------------------
    struct MinedBlock {
        uint256 blockNumber;
        bytes32 blockHash;
        address miner;
        uint256 timestamp;
        bool claimed;
    }
    MinedBlock[] public blockHistory;

    /**
     * @dev Marked "public" so the server or front-end can read it directly.
     *      This auto-generates a getter named blockAlreadyUsed(address,uint256).
     */
    mapping(address => mapping(uint256 => bool)) public blockAlreadyUsed;

    // Mining events
    event BlockMined(uint256 indexed blockNumber, bytes32 blockHash, address indexed miner);
    event RewardClaimed(uint256 indexed blockNumber, address indexed miner, uint256 reward);

    // --------------------------
    // Constructor
    // --------------------------
    /**
     * @dev The `_paymentToken` is the address of the ERC20 token used for subscription payments.
     *      The deployer becomes the owner (via Ownable(msg.sender)).
     */
    constructor(address _paymentToken)
        ERC20("ShareCoin", "SHARE")
        Ownable(msg.sender)
        ReentrancyGuard()
    {
        // Set the subscription payment token (adjust if needed)
        paymentToken = ERC20(_paymentToken);

        // Example token logo URI (optional)
        tokenLogoURI = "https://roostintheroost.mypinata.cloud/ipfs/bafkreiddwmryxzc5xd6ajs4c7nrwl274vq3tfscfa3orc5ockfz";
    }

    // --------------------------
    // Purchase Subscription
    // --------------------------
    function purchaseSubscription(PlanType plan, uint256 daysCount) external nonReentrant {
        require(
            plan == PlanType.Basic ||
            plan == PlanType.Standard ||
            plan == PlanType.Premium,
            "Invalid plan"
        );
        require(daysCount > 0, "daysCount=0?");
        require(!subscriptionActiveFor(msg.sender), "Already subscribed");

        uint256 dailyRate;
        if (plan == PlanType.Basic)    dailyRate = basicDailyRate;
        if (plan == PlanType.Standard) dailyRate = standardDailyRate;
        if (plan == PlanType.Premium)  dailyRate = premiumDailyRate;

        uint256 totalPrice = dailyRate * daysCount;
        bool success = paymentToken.transferFrom(msg.sender, address(this), totalPrice);
        require(success, "Payment failed");

        uint256 expiry = block.timestamp + (daysCount * 1 days);
        subscriptions[msg.sender] = expiry;
        userPlan[msg.sender] = plan;

        emit SubscriptionPurchased(msg.sender, plan, expiry);
    }

    function purchaseLifetimeSubscription() external nonReentrant {
        require(lifetimeSold < lifetimeLimit, "Lifetime limit reached");
        require(!subscriptionActiveFor(msg.sender), "Already subscribed");

        bool success = paymentToken.transferFrom(msg.sender, address(this), lifetimePrice);
        require(success, "Payment failed");

        // Mark subscription as effectively infinite
        subscriptions[msg.sender] = type(uint256).max;
        userPlan[msg.sender] = PlanType.Lifetime;

        lifetimeSold++;
        emit LifetimeSubscriptionPurchased(msg.sender);
    }

    function subscriptionActiveFor(address user) public view returns (bool) {
        return subscriptions[user] > block.timestamp;
    }

    // For the front end to read all subscription data
    function getSubscriptionInfo(address user)
        external
        view
        returns (PlanType plan, uint256 expiry, bool isActive)
    {
        plan = userPlan[user];
        expiry = subscriptions[user];
        isActive = subscriptionActiveFor(user);
    }

    // Owner can withdraw subscription fees
    function ownerWithdrawSubscriptionFunds(uint256 amount) external onlyOwner {
        require(paymentToken.balanceOf(address(this)) >= amount, "Not enough subscription funds");
        bool success = paymentToken.transfer(msg.sender, amount);
        require(success, "Withdraw transfer failed");

        emit WithdrawnSubscriptionFunds(amount);
    }

    // --------------------------
    // Submit Mined Blocks (User)
    // --------------------------
    function submitMinedBlock(uint256 _blockNumber, uint256 nonce) external {
        require(subscriptionActiveFor(msg.sender), "Subscription expired");
        require(!blockAlreadyUsed[msg.sender][_blockNumber], "Block already used!");
        blockAlreadyUsed[msg.sender][_blockNumber] = true;

        bytes32 computedHash = keccak256(abi.encodePacked(_blockNumber, msg.sender, nonce));

        blockHistory.push(MinedBlock({
            blockNumber: _blockNumber,
            blockHash: computedHash,
            miner: msg.sender,
            timestamp: block.timestamp,
            claimed: false
        }));

        emit BlockMined(_blockNumber, computedHash, msg.sender);
    }

    function submitMultipleMinedBlocksAndMint(
        uint256[] calldata blockNumbers,
        uint256[] calldata nonces
    ) external nonReentrant {
        require(subscriptionActiveFor(msg.sender), "Subscription expired");
        require(blockNumbers.length == nonces.length, "Array mismatch");

        for (uint256 i = 0; i < blockNumbers.length; i++) {
            uint256 blockNum = blockNumbers[i];
            require(!blockAlreadyUsed[msg.sender][blockNum], "Block already used!");
            blockAlreadyUsed[msg.sender][blockNum] = true;

            bytes32 computedHash = keccak256(
                abi.encodePacked(blockNum, msg.sender, nonces[i])
            );

            blockHistory.push(MinedBlock({
                blockNumber: blockNum,
                blockHash: computedHash,
                miner: msg.sender,
                timestamp: block.timestamp,
                claimed: true
            }));

            // Mint block reward
            uint256 newSupply = totalSupply() + BLOCK_REWARD;
            require(newSupply <= MAX_SUPPLY, "Max supply exceeded");
            _mint(msg.sender, BLOCK_REWARD);

            emit BlockMined(blockNum, computedHash, msg.sender);
            emit RewardClaimed(blockNum, msg.sender, BLOCK_REWARD);
        }
    }

    // --------------------------
    // Server-based Submit & Mint
    // --------------------------
    function serverSubmitMultipleMinedBlocksAndMintOnBehalf(
        address user,
        uint256[] calldata blockNumbers,
        uint256[] calldata nonces
    ) external onlyOwner nonReentrant {
        require(subscriptionActiveFor(user), "Subscription expired");
        require(blockNumbers.length == nonces.length, "Array mismatch");

        for (uint256 i = 0; i < blockNumbers.length; i++) {
            uint256 blockNum = blockNumbers[i];
            require(!blockAlreadyUsed[user][blockNum], "Block already used!");
            blockAlreadyUsed[user][blockNum] = true;

            bytes32 computedHash = keccak256(
                abi.encodePacked(blockNum, user, nonces[i])
            );

            blockHistory.push(MinedBlock({
                blockNumber: blockNum,
                blockHash: computedHash,
                miner: user,
                timestamp: block.timestamp,
                claimed: true
            }));

            uint256 newSupply = totalSupply() + BLOCK_REWARD;
            require(newSupply <= MAX_SUPPLY, "Max supply exceeded");
            _mint(user, BLOCK_REWARD);

            emit BlockMined(blockNum, computedHash, user);
            emit RewardClaimed(blockNum, user, BLOCK_REWARD);
        }
    }

    // Return how many blocks exist, so front end can display “BlockHeight”
    function getBlockHistoryLength() external view returns (uint256) {
        return blockHistory.length;
    }

    // --------------------------
    // Claim Rewards (Older Style)
    // --------------------------
    function claimReward(uint256 index) external nonReentrant {
        require(index < blockHistory.length, "Invalid index");
        MinedBlock storage minedBlock = blockHistory[index];
        require(minedBlock.miner == msg.sender, "Not the miner");
        require(!minedBlock.claimed, "Already claimed");

        uint256 newSupply = totalSupply() + BLOCK_REWARD;
        require(newSupply <= MAX_SUPPLY, "Max supply exceeded");

        minedBlock.claimed = true;
        _mint(msg.sender, BLOCK_REWARD);

        emit RewardClaimed(minedBlock.blockNumber, msg.sender, BLOCK_REWARD);
    }

    function claimMultipleRewards(uint256[] calldata indexes) external nonReentrant {
        for (uint256 i = 0; i < indexes.length; i++) {
            uint256 idx = indexes[i];
            require(idx < blockHistory.length, "Invalid index");

            MinedBlock storage minedBlock = blockHistory[idx];
            require(minedBlock.miner == msg.sender, "Not the miner");
            require(!minedBlock.claimed, "Already claimed");

            uint256 newSupply = totalSupply() + BLOCK_REWARD;
            require(newSupply <= MAX_SUPPLY, "Max supply exceeded");

            minedBlock.claimed = true;
            _mint(msg.sender, BLOCK_REWARD);

            emit RewardClaimed(minedBlock.blockNumber, msg.sender, BLOCK_REWARD);
        }
    }

    // --------------------------
    // (Optional) Adjust Difficulty
    // --------------------------
    function setDifficulty(uint256 newDifficulty) external onlyOwner {
        defaultDifficulty = newDifficulty;
        emit DifficultySet(newDifficulty);
    }
}
