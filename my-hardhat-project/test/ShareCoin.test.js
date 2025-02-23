const { expect } = require("chai");

describe("ShareCoin", function () {
  let ShareCoin, shareCoin, owner, addr1;
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    ShareCoin = await ethers.getContractFactory("ShareCoin");
    shareCoin = await ShareCoin.deploy();
    await shareCoin.deployed();
  });

  it("Should deploy with 0 total supply", async function () {
    expect(await shareCoin.totalSupply()).to.equal(0);
  });

  it("Owner can mint tokens", async function () {
    const amount = ethers.utils.parseEther("1000");
    await shareCoin.mint(addr1.address, amount);
    expect(await shareCoin.balanceOf(addr1.address)).to.equal(amount);
  });

  it("Cannot mint beyond max supply", async function () {
    const maxSupply = await shareCoin.MAX_SUPPLY();
    await shareCoin.mint(addr1.address, maxSupply);
    await expect(
      shareCoin.mint(addr1.address, 1)
    ).to.be.revertedWith("Exceeds max supply");
  });
});
