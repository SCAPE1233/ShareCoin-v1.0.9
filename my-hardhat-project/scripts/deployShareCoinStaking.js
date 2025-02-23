// scripts/deploy.js

async function main() {
  const [deployer] = await ethers.getSigners(); // Ethers v6 convenience in Hardhat
  console.log("Deploying contracts with the account:", deployer.address);

  // Example addresses for tokens:
  const SHRTokenAddress = "0x713440E3939eA8F841BecFfc14FF61E349772a3F"; // e.g., your staking token
  const INCtokenAddress = "0x826e4e896CC2f5B371Cd7Bb0bd929DB3e3DB67c0"; // e.g., your reward token

  // Example reward rate: 1 token per staked token per second (scaled by 1e18)
  // This is extremely high, so adjust as needed. e.g. parseEther("0.00001")
  const rewardRate = ethers.parseEther("1");

  // Get the contract factory
  const ShareCoinStaking = await ethers.getContractFactory("ShareCoinStaking");

  // Deploy the contract with the given constructor parameters:
  //   (address _stakingToken, address _rewardToken, uint256 _rewardRate)
  const stakingContract = await ShareCoinStaking.deploy(
    SHRTokenAddress,
    INCtokenAddress,
    rewardRate
  );

  // Wait for it to be deployed
  await stakingContract.waitForDeployment();

  // Ethers v6 uses `.target` for the deployed address
  console.log("ShareCoinStaking deployed to:", stakingContract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });
