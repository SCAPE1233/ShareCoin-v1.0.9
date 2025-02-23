async function main() {
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.deploy();
  await subscription.waitForDeployment();
  console.log("Subscription deployed to:", subscription.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
