const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Subscription Contract", function () {
  let Subscription, subscription, owner, addr1;

  beforeEach(async function () {
    Subscription = await ethers.getContractFactory("Subscription");
    [owner, addr1] = await ethers.getSigners();
    subscription = await Subscription.deploy();
    // No need to call subscription.deployed() in ethers v6
  });

  it("Should activate a subscription correctly", async function () {
    const duration = 120;
    const cost = ethers.parseEther("0.01"); // Updated here
    await expect(
      subscription.connect(addr1).activateSubscription(duration, cost, { value: cost })
    )
      .to.emit(subscription, "SubscriptionActivated")
      .withArgs(addr1.address, duration, cost);
    const expiry = await subscription.subscriptions(addr1.address);
    expect(expiry).to.be.gt(0);
  });

  it("Should update the challenge", async function () {
    const initialChallenge = await subscription.challenge();
    await subscription.updateChallenge();
    const newChallenge = await subscription.challenge();
    expect(newChallenge).to.not.equal(initialChallenge);
  });

  it("Should submit a solution", async function () {
    await expect(subscription.submitSolution(12345))
      .to.emit(subscription, "SolutionSubmitted")
      .withArgs(owner.address, 12345, 50);
  });
});
