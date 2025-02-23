/***********************************************************
 * cloudMiner.js
 *
 * A basic Node.js script that simulates "cloud mining"
 * by periodically choosing a winner, generating block data,
 * and calling submitBlockOnBehalfOf(...) on your contract.
 *
 * Requirements:
 *   npm install ethers dotenv
 *   (and place .env with PULSECHAIN_RPC, PRIVATE_KEY, CONTRACT_ADDRESS)
 ************************************************************/
require("dotenv").config();
const { ethers } = require("ethers");

/********************************************
 * 1) Configuration
 ********************************************/
const RPC_URL = process.env.PULSECHAIN_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Gas cost per submission (in your payment token's decimals).
// For example, if you have a USDC-like token with 6 decimals, adapt accordingly.
const GAS_COST_PER_BLOCK = ethers.parseUnits("5", 18); // "5" tokens as an example

// If your contract has multiple active subscribers, you might track them here:
const subscribers = [
  {
    address: "0xUser1...", // Must have subscribed + deposited gas
    plan: "Basic",
  },
  {
    address: "0xUser2...",
    plan: "Premium",
  },
  // etc. Add or fetch from a DB if needed.
];

/********************************************
 * 2) Connect to RPC + Contract
 ********************************************/
const provider = new ethers.JsonRpcProvider(RPC_URL);
let signer;
let contract;

// The ABI needs to include submitBlockOnBehalfOf + events + any used functions
// Replace with your actual compiled ABI or import from artifact.
const ABI = [
  "function submitBlockOnBehalfOf(address winner, uint256[] calldata _blockNumbers, uint256[] calldata nonces, uint256 gasCost) external",
  // Possibly other contract functions you call
  "function subscriptionActiveFor(address user) view returns (bool)",
];

/********************************************
 * 3) Initialization
 ********************************************/
async function init() {
  signer = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  console.log("Cloud Miner Script started");
  console.log("Using contract:", CONTRACT_ADDRESS);
  console.log("Signer address:", await signer.getAddress());
}

/********************************************
 * 4) Mining Logic
 ********************************************/
/**
 * pickRandomSubscriber:
 *   In a real app, you might weigh Basic vs. Premium differently,
 *   or remove inactive subscribers, etc. For now, picks random user.
 */
function pickRandomSubscriber() {
  const idx = Math.floor(Math.random() * subscribers.length);
  return subscribers[idx];
}

/**
 * mineBlock:
 *   1) Picks a winner
 *   2) Creates a random blockNumber + nonce
 *   3) Calls submitBlockOnBehalfOf(...) with single block
 */
async function mineBlock() {
  try {
    const winner = pickRandomSubscriber();

    // (Optional) Check if they're actually active on-chain
    const isActive = await contract.subscriptionActiveFor(winner.address);
    if (!isActive) {
      console.log(`Subscriber ${winner.address} is NOT active. Skipping block submission.`);
      return;
    }

    // Generate a random blockNumber & nonce
    const blockNumber = Math.floor(Math.random() * 10_000_000); 
    const nonce = Math.floor(Math.random() * 1e9);

    // We'll pass arrays of length 1
    const blockNumbers = [blockNumber];
    const nonces = [nonce];

    // Gas cost in tokens (like 5 tokens). Adjust for your logic
    const gasCost = GAS_COST_PER_BLOCK;

    console.log("----------------------------------------------------");
    console.log(`Mining block for: ${winner.address}`);
    console.log(`blockNumber=${blockNumber}, nonce=${nonce}, gasCost=${gasCost}`);

    // Call the contract
    const tx = await contract.submitBlockOnBehalfOf(
      winner.address,
      blockNumbers,
      nonces,
      gasCost
    );
    console.log("Tx submitted:", tx.hash);

    const receipt = await tx.wait();
    console.log("Mined block! Tx confirmed in block:", receipt.blockNumber);

  } catch (err) {
    console.error("mineBlock error:", err);
  }
}

/********************************************
 * 5) Main Loop / setInterval
 ********************************************/
async function main() {
  await init();

  // Example: call `mineBlock()` once on startup
  await mineBlock();

  // Then call it every 60 seconds (1 minute)
  setInterval(async () => {
    await mineBlock();
  }, 60_000);
}

/********************************************
 * 6) Run
 ********************************************/
main().catch((err) => {
  console.error("Fatal error in main:", err);
});
