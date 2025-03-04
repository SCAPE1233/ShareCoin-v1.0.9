export const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  ];
  
  // 1) New contract address:
  export const SHARECOIN_ADDRESS = "0x03EA2507C5cAF3E75B7D417b5ACfE6dfA0beBAa1";
  export const SHARECOIN_ABI = [
    // Subscription
    "function subscriptionActiveFor(address user) view returns (bool)",
    "function purchaseSubscription(uint8 plan, uint256 daysCount) external",
    "function purchaseLifetimeSubscription() external",
    "function userPlan(address) view returns (uint8)",
    "function subscriptions(address) view returns (uint256)",
  
    // Mining
    "function submitMultipleMinedBlocksAndMint(uint256[], uint256[]) external",
    "function getBlockHistoryLength() view returns (uint256)",
  
    // Owner ops
    "function ownerWithdrawSubscriptionFunds(uint256 amount) external",
    "function setDifficulty(uint256 newDifficulty) external",
  
    // Basic ERC20
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  
    // ERC20
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ];
  