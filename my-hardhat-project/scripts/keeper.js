// keeper.js
require("dotenv").config();
const cron = require("node-cron");
const { ethers } = require("ethers");

// Set up provider using the testnet RPC URL from .env
const provider = new ethers.JsonRpcProvider(process.env.PULSECHAIN_RPC);

// Use your testnet private key from .env
const privateKey = process.env.PULSECHAIN_PRIVATE_KEY;
if (!privateKey) {
  console.log("No PULSECHAIN_PRIVATE_KEY found in .env, using default signer from provider.");
}
const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : null;

// Set your contract address from .env (or default to a fallback address)
const contractAddress = process.env.CONTRACT_ADDRESS || "0xE2cBc4bB54cAC4FdF00f240f3ccCc0f7c2e55879";

// Minimal ABI for your Subscription contract (update if needed)
const contractABI = [
  "function updateChallenge() external",
  "function challenge() view returns (bytes32)",
  "event ChallengeUpdated(uint256 newTime, bytes32 newChallenge)"
];

// Create a contract instance using the wallet or provider's signer
async function getContract() {
  const signer = wallet || (await provider.getSigner());
  return new ethers.Contract(contractAddress, contractABI, signer);
}

// Function to update the challenge by calling the contract
async function updateChallenge() {
  try {
    console.log("Calling updateChallenge...");
    const contract = await getContract();
    const tx = await contract.updateChallenge();
    await tx.wait();
    console.log("Challenge updated successfully!");
  } catch (error) {
    console.error("Error updating challenge:", error);
  }
}

// Schedule the updateChallenge() to run every 10 minutes.
// For testing, you might set it to every minute ("*/1 * * * *")
cron.schedule("*/1 * * * *", () => {
  console.log("Cron job triggered: updating challenge...");
  updateChallenge();
});

console.log("Keeper script started. Waiting for cron trigger...");
