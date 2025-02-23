// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShareCoinStaking
 * @dev A staking contract where users stake one ERC20 token (e.g. SHR) to earn another ERC20 (e.g. INC).
 *
 * - Constructor accepts addresses for stakingToken, rewardToken, and an initial rewardRate
 * - Inherits Ownable(msg.sender) for older custom OpenZeppelin versions
 * - Adds convenience functions: balanceOf() and earned() for front-end usage
 */
contract ShareCoinStaking is Ownable, ReentrancyGuard {
    /// @notice The token stakers deposit
    ERC20 public immutable stakingToken;

    /// @notice The token distributed as rewards
    ERC20 public immutable rewardToken;

    /**
     * @notice Reward rate in (rewardTokens per stakedToken) per second, scaled by 1e18.
     * For example, 1e16 => 0.01 reward tokens per staked token per second.
     */
    uint256 public rewardRate;

    /// @notice Total tokens staked in this contract.
    uint256 public totalStaked;

    /// @dev Info about each staker
    struct StakeInfo {
        uint256 amount;     // Amount of tokens staked
        uint256 rewardDebt; // Accumulated (unclaimed) rewards
        uint256 lastUpdate; // Last time we updated this user's rewards
    }

    /// @notice Mapping from user => stake info
    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRewardRate);

    /**
     * @dev Constructor takes the addresses of the staking token, reward token, and initial reward rate.
     * @param _stakingToken address of the token users will stake
     * @param _rewardToken  address of the token that is paid as reward
     * @param _rewardRate   initial reward rate (scaled by 1e18)
     */
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0),  "Invalid reward token");

        stakingToken = ERC20(_stakingToken);
        rewardToken  = ERC20(_rewardToken);
        rewardRate   = _rewardRate;
    }

    /**
     * @notice Internal function to update a user's accumulated rewards.
     */
    function _updateReward(address user) internal {
        StakeInfo storage stake = stakes[user];
        if (stake.amount > 0) {
            uint256 elapsed = block.timestamp - stake.lastUpdate;
            // pending = elapsed * userStaked * rewardRate / 1e18
            uint256 pending = (elapsed * stake.amount * rewardRate) / 1e18;
            stake.rewardDebt += pending;
        }
        stake.lastUpdate = block.timestamp;
    }

    /**
     * @notice Stake a certain amount of the stakingToken.
     * @param amount The amount of tokens to stake.
     */
    function stakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake zero tokens");
        _updateReward(msg.sender);

        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        stakes[msg.sender].amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake a certain amount of tokens and claim any outstanding rewards.
     * @param amount The amount of tokens to unstake.
     */
    function unstakeTokens(uint256 amount) external nonReentrant {
        StakeInfo storage stake = stakes[msg.sender];
        require(stake.amount >= amount, "Insufficient staked amount");

        _updateReward(msg.sender);

        stake.amount -= amount;
        totalStaked -= amount;

        // The user's accumulated rewards (not yet claimed)
        uint256 reward = stake.rewardDebt;
        stake.rewardDebt = 0;

        bool success1 = stakingToken.transfer(msg.sender, amount);
        require(success1, "Unstake transfer failed");

        bool success2 = rewardToken.transfer(msg.sender, reward);
        require(success2, "Reward transfer failed");

        emit Unstaked(msg.sender, amount, reward);
    }

    /**
     * @notice Claim any outstanding rewards without unstaking tokens.
     */
    function claimReward() external nonReentrant {
        _updateReward(msg.sender);
        uint256 reward = stakes[msg.sender].rewardDebt;
        require(reward > 0, "No rewards to claim");

        stakes[msg.sender].rewardDebt = 0;

        bool success = rewardToken.transfer(msg.sender, reward);
        require(success, "Reward transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Owner can update the reward rate (scaled by 1e18).
     */
    function updateRewardRate(uint256 _newRewardRate) external onlyOwner {
        rewardRate = _newRewardRate;
        emit RewardRateUpdated(_newRewardRate);
    }

    /**
     * @notice View function to see how much a user has staked and how much reward is pending (locally).
     */
    function getUserStakeInfo(address user) external view returns (uint256 staked, uint256 pendingRewards) {
        StakeInfo memory stake = stakes[user];
        uint256 pending = 0;
        if (stake.amount > 0) {
            uint256 elapsed = block.timestamp - stake.lastUpdate;
            pending = (elapsed * stake.amount * rewardRate) / 1e18;
        }
        return (stake.amount, stake.rewardDebt + pending);
    }

    // -------------------------------------------------------------------------
    // ADDED FUNCTIONS to match your front-end calls:
    //   - balanceOf(address user)
    //   - earned(address user)
    // -------------------------------------------------------------------------

    /**
     * @notice Returns how many tokens the user currently has staked.
     */
    function balanceOf(address user) external view returns (uint256) {
        return stakes[user].amount;
    }

    /**
     * @notice Returns how many rewards (tokens) the user has earned so far, including any unclaimed portion.
     */
    function earned(address user) external view returns (uint256) {
        StakeInfo memory stake = stakes[user];
        if (stake.amount == 0) {
            return stake.rewardDebt;
        }
        uint256 elapsed = block.timestamp - stake.lastUpdate;
        uint256 pending = (elapsed * stake.amount * rewardRate) / 1e18;
        return stake.rewardDebt + pending;
    }
}
