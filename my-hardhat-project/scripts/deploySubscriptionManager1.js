// scripts/deploySubscriptionManager.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying SubscriptionManager...");

  const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy();
  console.log("Transaction sent. Waiting for confirm...");

  // New method in ethers v6
  await subscriptionManager.waitForDeployment();

  // Get contract address in ethers v6
  const contractAddress = await subscriptionManager.getAddress();
  console.log("SubscriptionManager deployed to:", contractAddress);
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
