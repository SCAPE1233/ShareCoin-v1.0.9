const { ethers } = require("hardhat");

async function main() {
  const myContract = await ethers.getContractAt("MyContract", "0xYourDeployedAddress");

  // For instance, call a read function:
  const result = await myContract.someViewFunction();
  console.log("Result:", result.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
