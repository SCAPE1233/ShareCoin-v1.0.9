// app/constants/contractABI.ts

//
// 1) Payment Token (e.g. tDAI) for subscriptions
//
export const PAYMENT_TOKEN_ADDRESS = "0x826e4e896CC2f5B371Cd7Bb0bd929DB3e3DB67c0";

// Minimal / complete ERC20 ABI for your payment token
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

//
// 2) ShareCoin Contract
//    (Your unified subscription + mining + ERC20 contract.)
//
export const SHARECOIN_ADDRESS = "0x66109699EaebC93c9Df7ce3c3342AEbC009E2896";
export const SHARECOIN_ABI = [
  // Subscription-related
  "function subscriptionActiveFor(address user) view returns (bool)",
  "function purchaseSubscription(uint8 plan, uint256 daysCount) external",
  "function purchaseLifetimeSubscription() external",
  "function submitMultipleMinedBlocksAndMint(uint256[], uint256[]) external",
  
  // Mining-related
  "function submitMinedBlock(uint256 blockNumber, uint256 nonce) external",
  "function claimReward(uint256 index) external",
  "function claimMultipleRewards(uint256[] calldata indexes) external",
  "function getBlockHistoryLength() view returns (uint256)",

  // Owner operations
  "function ownerWithdrawSubscriptionFunds(uint256 amount) external",
  "function setDifficulty(uint256 newDifficulty) external",

  // Basic ERC20 reads (optional if you want to read them via this ABI)
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function blockHistory(uint256) view returns (uint256 blockNumber, bytes32 blockHash, address miner, uint256 timestamp, bool claimed)",

  // Because it's ERC20:
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

//
// 3) Pulse Router V2 (for your swap page, if needed)
//
export const PULSE_ROUTER_V2_ADDRESS = "0x165C3410fC91EF562C50559f7d2289fEbed552d9";
export const PULSE_ROUTER_V2_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_factory", "type": "address" },
      { "internalType": "address", "name": "_WPLS", "type": "address" }
    ],
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "WPLS",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

//
// 4) List of available tokens (for your swap UI, optional)
//
export const availableTokens = [
  { symbol: "PLS", address: "0x0000000000000000000000000000000000000000", logo: "/tokens/pls.png" },
  { symbol: "HEX", address: "0x2b591e99afE9F32eAA6214f7B7629768c40Eeb39", logo: "/tokens/hex.png" },
  { symbol: "DAI", address: "0xefD766cCb38EaF1dfd701853BFCe31359239F305", logo: "/tokens/dai.png" },
  { symbol: "WETH", address: "0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C", logo: "/tokens/weth.png" },
  { symbol: "INC", address: "0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d", logo: "/tokens/inc.png" },
  { symbol: "USDC", address: "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07", logo: "/tokens/usdc.png" },
  { symbol: "PLSX", address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", logo: "/tokens/plsx.png" }
];
