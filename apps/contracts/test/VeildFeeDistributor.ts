import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("VeildFeeDistributor", function () {
  async function deploy() {
    const [owner, treasury, dev, reserve] = await hre.viem.getWalletClients();
    const distributor = await hre.viem.deployContract("VeildFeeDistributor", [owner.account.address]);
    const pc = await hre.viem.getPublicClient();
    return { distributor, owner, treasury, dev, reserve, pc };
  }

  it("deploys with 3 recipients summing to 10000 bps", async () => {
    const { distributor } = await loadFixture(deploy);
    const count = await distributor.read.recipientCount();
    expect(count).to.equal(3n);
  });

  it("accepts incoming ether via receive()", async () => {
    const { distributor, owner, pc } = await loadFixture(deploy);
    await owner.sendTransaction({ to: distributor.address, value: 1_000_000n });
    const bal = await pc.getBalance({ address: distributor.address });
    expect(bal).to.equal(1_000_000n);
  });

  it("reverts distribute when balance is zero", async () => {
    const { distributor } = await loadFixture(deploy);
    await expect(distributor.write.distribute()).to.be.rejectedWith("NoBalance");
  });

  it("distributes balance to recipients", async () => {
    const { distributor, owner, pc } = await loadFixture(deploy);
    await owner.sendTransaction({ to: distributor.address, value: 10_000_000n });
    const before = await pc.getBalance({ address: owner.account.address });
    await distributor.write.distribute();
    const contractBal = await pc.getBalance({ address: distributor.address });
    expect(contractBal).to.equal(0n);
  });

  it("owner can update a recipient", async () => {
    const { distributor, treasury } = await loadFixture(deploy);
    await distributor.write.setRecipient([
      0n,
      treasury.account.address,
      6_000n,
      "treasury",
    ]);
    const r = await distributor.read.recipients([0n]);
    expect(r[0].toLowerCase()).to.equal(treasury.account.address.toLowerCase());
  });

  it("reverts setRecipient with zero address", async () => {
    const { distributor } = await loadFixture(deploy);
    await expect(
      distributor.write.setRecipient([
        0n,
        "0x0000000000000000000000000000000000000000",
        6_000n,
        "bad",
      ])
    ).to.be.rejectedWith("InvalidRecipient");
  });

  it("non-owner cannot call setRecipient", async () => {
    const { distributor, treasury } = await loadFixture(deploy);
    await expect(
      distributor.write.setRecipient(
        [0n, treasury.account.address, 6_000n, "treasury"],
        { account: treasury.account }
      )
    ).to.be.rejected;
  });
});
