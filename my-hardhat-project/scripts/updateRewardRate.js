// scripts/updateRewardRate.js
const { ethers } = require("hardhat");

// Example: set rewardRate to ~1.1574e8 
// (for 10,000 staked => 0.1 tDAI/day).
const NEW_REWARD_RATE = "115740000";

async function main() {
  // The owner’s private key must be in your .env or hardhat config
  // so you can get a signer with correct permissions.
  const [deployer] = await ethers.getSigners();

  console.log("Using owner/deployer account:", deployer.address);

  // Replace with your deployed staking contract address
  const stakingContractAddress = "0xYourStakingContractAddress";

  // If your artifact is named "ShareCoinStaking.json" with a top-level "abi":
  const stakingArtifact = require("../artifacts/contracts/ShareCoinStaking.sol/ShareCoinStaking.json");
  const stakingABI = stakingArtifact.abi;

  // Connect to the staking contract
  const stakingContract = new ethers.Contract(
    stakingContractAddress,
    stakingABI,
    deployer
  );

  // Call updateRewardRate(newRate)
  console.log("Updating reward rate to:", NEW_REWARD_RATE, "...");
  const tx = await stakingContract.updateRewardRate(NEW_REWARD_RATE);
  await tx.wait();

  // Confirm
  const updatedRate = await stakingContract.rewardRate();
  console.log("Done! New rewardRate is:", updatedRate.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error updating rewardRate:", error);
    process.exit(1);
  });
