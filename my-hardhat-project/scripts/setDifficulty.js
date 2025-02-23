// scripts/setDifficulty.js
const { ethers } = require("hardhat");

async function main() {
  const shareCoinAddress = "0xf12FACaF2De7903a7E43298061D11B2c8253962A"; // your deployed contract address

  const ShareCoin = await ethers.getContractFactory("ShareCoin");
  const shareCoin = ShareCoin.attach(shareCoinAddress);

  const [owner] = await ethers.getSigners();
  console.log("Owner address:", owner.address);

  // Try using a moderately high difficulty value (adjust as necessary for testing)
  const newDifficulty = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // Maximum uint256

  console.log("Setting difficulty to:", newDifficulty);
  const tx = await shareCoin.connect(owner).setDifficulty(newDifficulty, { gasLimit: 5_000_000 });
  await tx.wait();
  console.log("Difficulty updated!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script:", error);
    process.exit(1);
  });
