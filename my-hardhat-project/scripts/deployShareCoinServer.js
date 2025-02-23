// scripts/deployShareCoinServer.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying ShareCoin contract using account:", deployer.address);

  // 1) Get the ContractFactory
  const ShareCoin = await hre.ethers.getContractFactory("ShareCoin");

  // 2) Define your payment token address
  const paymentTokenAddress = "0x826e4e896CC2f5B371Cd7Bb0bd929DB3e3DB67c0";

  // 3) Deploy with the required constructor argument
  const shareCoin = await ShareCoin.deploy(paymentTokenAddress);

  // 4) Wait for the deployment to be mined
  await shareCoin.deploymentTransaction().wait();

  console.log("ShareCoin deployed at:", shareCoin.target);
}

main().catch((error) => {
  console.error("Deployment error:", error);
  process.exitCode = 1;
});
