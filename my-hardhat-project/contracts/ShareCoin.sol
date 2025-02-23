// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShareCoin
 * @notice Example of a single contract that:
 *   1) Is an ERC20 token w/ 21M max supply,
 *   2) Allows day-based subscriptions (Basic/Standard/Premium) OR a limited (max 50) Lifetime plan,
 *   3) Provides simulated PoW via submitMinedBlock() or submitMultipleMinedBlocksAndMint().
 */
contract ShareCoin is ERC20, Ownable, ReentrancyGuard {
    // --------------------------
    // 1) ERC20 Setup
    // --------------------------
    uint256 public constant MAX_SUPPLY   = 21_000_000 * 10**18; // 21M max
    uint256 public constant BLOCK_REWARD = 50 * 10**18;         // 50 SHR per block

    // Example token logo URL
    string public tokenLogoURI;

    // Payment token for subscriptions (e.g. USDC).
    ERC20 public paymentToken;

    // (No real difficulty check if you don't want it.)
    uint256 public defaultDifficulty = 0;

    // If you want confirmations, set >0
    uint256 public confirmationThreshold = 0;

    // --------------------------
    // 2) Subscription Manager
    // --------------------------
    enum PlanType { None, Basic, Standard, Premium, Lifetime }

    // user => subscription expiry (block.timestamp + N seconds), or type(uint256).max for lifetime
    mapping(address => uint256) public subscriptions;

    // user => last plan purchased (for reference)
    mapping(address => PlanType) public userPlan;

    // For lifetime: max 50 total
    uint256 public lifetimeLimit = 50;
    uint256 public lifetimeSold;

    // Hard-coded daily rates, e.g. Basic=20/day, Standard=40, Premium=60
    uint256 public basicDailyRate    = 20  * 10**18;
    uint256 public standardDailyRate = 40  * 10**18;
    uint256 public premiumDailyRate  = 60  * 10**18;

    // Hard-coded lifetime price, e.g. 5000 tokens
    uint256 public lifetimePrice     = 5000 * 10**18;

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

    // NEW: Track which (miner, blockNumber) was already used
    mapping(address => mapping(uint256 => bool)) public blockAlreadyUsed;

    // Mining events
    event BlockMined(uint256 indexed blockNumber, bytes32 blockHash, address indexed miner);
    event RewardClaimed(uint256 indexed blockNumber, address indexed miner, uint256 reward);

    // --------------------------
    // Constructor
    // --------------------------
    constructor(address _paymentToken)
        ERC20("ShareCoin", "SHR")
        Ownable(msg.sender)
        ReentrancyGuard()
    {
        // Hard-coded payment token address
        paymentToken = ERC20(_paymentToken);

        // Example token logo URI
        tokenLogoURI = "https://roostintheroost.mypinata.cloud/ipfs/bafkreiddwmryxzc5xd6ajs4c7nrwl274vq3tfscfa3orc5ockfz";
    }

    // --------------------------
    // Purchase Subscription
    // --------------------------
    /**
     * @dev Buy a day-based subscription for (Basic/Standard/Premium).
     * @param plan The plan enum: Basic=1,Standard=2,Premium=3
     * @param daysCount The number of days to purchase (e.g. 3,14,30,90).
     */
    function purchaseSubscription(PlanType plan, uint256 daysCount) external nonReentrant {
        require(
            plan == PlanType.Basic ||
            plan == PlanType.Standard ||
            plan == PlanType.Premium,
            "Invalid plan"
        );
        require(daysCount > 0, "daysCount=0?");
        require(!subscriptionActiveFor(msg.sender), "Already subscribed");

        // 1) compute total price
        uint256 dailyRate;
        if (plan == PlanType.Basic)    dailyRate = basicDailyRate;
        if (plan == PlanType.Standard) dailyRate = standardDailyRate;
        if (plan == PlanType.Premium)  dailyRate = premiumDailyRate;

        // daysCount * dailyRate
        uint256 totalPrice = dailyRate * daysCount;

        // Transfer tokens
        bool success = paymentToken.transferFrom(msg.sender, address(this), totalPrice);
        require(success, "Payment failed");

        // set subscription expiry
        uint256 durationSeconds = daysCount * 1 days; // 86400
        uint256 expiry = block.timestamp + durationSeconds;
        subscriptions[msg.sender] = expiry;
        userPlan[msg.sender] = plan;

        emit SubscriptionPurchased(msg.sender, plan, expiry);
    }

    /**
     * @dev Purchase a lifetime plan, limited to 50 total.
     */
    function purchaseLifetimeSubscription() external nonReentrant {
        require(lifetimeSold < lifetimeLimit, "Lifetime limit reached");
        require(!subscriptionActiveFor(msg.sender), "Already subscribed");

        // Transfer lifetime price
        bool success = paymentToken.transferFrom(msg.sender, address(this), lifetimePrice);
        require(success, "Payment failed");

        // Mark sub as infinite
        subscriptions[msg.sender] = type(uint256).max;
        userPlan[msg.sender] = PlanType.Lifetime;

        lifetimeSold++;

        emit LifetimeSubscriptionPurchased(msg.sender);
    }

    /**
     * @dev Check if user is currently subscribed.
     */
    function subscriptionActiveFor(address user) public view returns (bool) {
        return subscriptions[user] > block.timestamp;
    }

    // --------------------------
    // EXTRA HELPER: getSubscriptionInfo
    // --------------------------
    /**
     * @dev Return a user's current subscription plan, expiry, and active boolean.
     */
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
    // Single-Block Submit (old)
    // --------------------------
    function submitMinedBlock(uint256 _blockNumber, uint256 nonce) external {
        require(subscriptionActiveFor(msg.sender), "Subscription expired");

        // NEW: revert if same (miner, blockNumber) was already used
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

    // --------------------------
    // Multi-Block Submit + AutoMint
    // --------------------------
    function submitMultipleMinedBlocksAndMint(
        uint256[] calldata _blockNumbers,
        uint256[] calldata nonces
    ) external nonReentrant {
        require(subscriptionActiveFor(msg.sender), "Subscription expired");
        require(_blockNumbers.length == nonces.length, "Array length mismatch");

        for (uint256 i = 0; i < _blockNumbers.length; i++) {
            // NEW: revert if same (miner, blockNumber) was already used
            require(!blockAlreadyUsed[msg.sender][_blockNumbers[i]], "Block already used!");
            blockAlreadyUsed[msg.sender][_blockNumbers[i]] = true;

            bytes32 computedHash = keccak256(
                abi.encodePacked(_blockNumbers[i], msg.sender, nonces[i])
            );

            blockHistory.push(MinedBlock({
                blockNumber: _blockNumbers[i],
                blockHash: computedHash,
                miner: msg.sender,
                timestamp: block.timestamp,
                claimed: true // auto-claimed
            }));

            uint256 newSupply = totalSupply() + BLOCK_REWARD;
            require(newSupply <= MAX_SUPPLY, "Max supply exceeded");
            _mint(msg.sender, BLOCK_REWARD);

            emit BlockMined(_blockNumbers[i], computedHash, msg.sender);
            emit RewardClaimed(_blockNumbers[i], msg.sender, BLOCK_REWARD);
        }
    }

    function getBlockHistoryLength() external view returns (uint256) {
        return blockHistory.length;
    }

    // --------------------------
    //  Claim Reward (Old)
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
            uint256 index = indexes[i];
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
    }

    // --------------------------
    //  Adjust Difficulty (opt)
    // --------------------------
    function setDifficulty(uint256 newDifficulty) external onlyOwner {
        defaultDifficulty = newDifficulty;
        emit DifficultySet(newDifficulty);
    }
}
