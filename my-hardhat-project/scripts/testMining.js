// scripts/testMining.js
require("dotenv").config();
const { ethers } = require("ethers");

// Connect to the provider (local or testnet)
const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC || "http://127.0.0.1:8545");

// Create a wallet instance using your PRIVATE_KEY from .env
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Get the contract address from .env
const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
  console.error("Please set CONTRACT_ADDRESS in your .env file");
  process.exit(1);
}

// Minimal ABI for the ShareCoin contract, including functions we need for mining.
const abi = [
  "function defaultDifficulty() view returns (uint256)",
  "function submitMinedBlock(uint256 _blockNumber, uint256 nonce) external",
  "function claimReward(uint256 index) external",
  "function getBlockHistoryLength() view returns (uint256)"
];

// Create a contract instance
const shareCoin = new ethers.Contract(contractAddress, abi, wallet);

async function main() {
  // Get the current block number
  const currentBlock = await provider.getBlockNumber();
  console.log("Current block number:", currentBlock);
  
  // For simulation, we use the current block number as our _blockNumber
  const _blockNumber = currentBlock;
  
  // Get the default difficulty from the contract
  const difficulty = await shareCoin.defaultDifficulty();
  console.log("Default difficulty:", difficulty.toString());
  
  // Simulate off-chain mining by iterating nonces until we find one that meets the target
  let nonce = 0;
  let validNonce = null;
  while (true) {
    // Compute the hash: keccak256(abi.encodePacked(_blockNumber, wallet.address, nonce))
    const encoded = ethers.defaultAbiCoder.encode(
      ["uint256", "address", "uint256"],
      [_blockNumber, wallet.address, nonce]
    );
    const computedHash = ethers.keccak256(encoded);
    // Check if the computed hash is below the difficulty target
    if (ethers.BigNumber.from(computedHash).lt(difficulty)) {
      validNonce = nonce;
      console.log("Found valid nonce:", nonce, "Hash:", computedHash);
      break;
    }
    nonce++;
    if (nonce % 1e6 === 0) {
      console.log(`Tried ${nonce} nonces so far...`);
    }
  }
  
  // Submit the mined block using the valid nonce
  console.log("Submitting mined block...");
  const submitTx = await shareCoin.submitMinedBlock(_blockNumber, validNonce);
  console.log("Submitted mined block. Tx hash:", submitTx.hash);
  await submitTx.wait();
  console.log("Mined block submitted successfully!");
  
  // Determine the confirmation threshold (you might use a fixed value or read from contract)
  const confirmationThreshold = 10; // for example
  const targetBlock = _blockNumber + confirmationThreshold;
  console.log("Waiting for block number to reach:", targetBlock);
  
  // Wait until the blockchain reaches the target block number
  while (true) {
    const bn = await provider.getBlockNumber();
    if (bn >= targetBlock) {
      console.log("Block number reached:", bn);
      break;
    }
    console.log("Current block:", bn, "Target:", targetBlock);
    // Wait for 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  
  // Get the index of the last mined block (should be the one we just submitted)
  const historyLength = await shareCoin.getBlockHistoryLength();
  const blockIndex = historyLength - 1;
  console.log("Attempting to claim reward for block index:", blockIndex);
  
  // Claim the reward for the mined block
  const claimTx = await shareCoin.claimReward(blockIndex);
  console.log("Claim reward tx hash:", claimTx.hash);
  await claimTx.wait();
  console.log("Reward claimed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
