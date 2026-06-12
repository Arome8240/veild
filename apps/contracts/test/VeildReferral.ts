import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("VeildReferral", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol, dave] = await hre.viem.getWalletClients();
    const registry = await hre.viem.deployContract("VeildRegistry");

    await registry.write.register(["alice", "Alice", "bio", "", "art"], { account: alice.account, value: 0n });
    await registry.write.register(["bob",   "Bob",   "bio", "", "art"], { account: bob.account,   value: 0n });

    const referral = await hre.viem.deployContract("VeildReferral", [registry.address]);
    return { referral, registry, owner, alice, bob, carol, dave };
  }

  describe("deployment", () => {
    it("sets owner and registry", async () => {
      const { referral, registry, owner } = await loadFixture(deployFixture);
      expect((await referral.read.owner()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect((await referral.read.registry()).toLowerCase()).to.equal(registry.address.toLowerCase());
    });

    it("totalReferrals starts at zero", async () => {
      const { referral } = await loadFixture(deployFixture);
      expect(await referral.read.totalReferrals()).to.equal(0n);
    });
  });

  describe("recordReferral", () => {
    it("owner can record a referral", async () => {
      const { referral, alice, carol } = await loadFixture(deployFixture);
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      expect(await referral.read.totalReferrals()).to.equal(1n);
    });

    it("credits referrer with REWARD_PER_REFERRAL", async () => {
      const { referral, alice, carol } = await loadFixture(deployFixture);
      const reward = await referral.read.REWARD_PER_REFERRAL();
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      const stats = await referral.read.getStats([alice.account.address]);
      expect(stats.pendingReward).to.equal(reward);
    });

    it("stores referredBy correctly", async () => {
      const { referral, alice, carol } = await loadFixture(deployFixture);
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      const referrer = await referral.read.getReferrer([carol.account.address]);
      expect(referrer.toLowerCase()).to.equal(alice.account.address.toLowerCase());
    });

    it("reverts on self-referral", async () => {
      const { referral, alice } = await loadFixture(deployFixture);
      await expect(
        referral.write.recordReferral([alice.account.address, alice.account.address])
      ).to.be.rejectedWith("SelfReferral");
    });

    it("reverts on double referral of same address", async () => {
      const { referral, alice, carol } = await loadFixture(deployFixture);
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      await expect(
        referral.write.recordReferral([alice.account.address, carol.account.address])
      ).to.be.rejectedWith("AlreadyReferred");
    });

    it("reverts when referrer is not registered", async () => {
      const { referral, carol, dave } = await loadFixture(deployFixture);
      await expect(
        referral.write.recordReferral([carol.account.address, dave.account.address])
      ).to.be.rejectedWith("ReferrerNotRegistered");
    });

    it("non-owner cannot record referral", async () => {
      const { referral, alice, carol } = await loadFixture(deployFixture);
      await expect(
        referral.write.recordReferral([alice.account.address, carol.account.address], { account: alice.account })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("claimReward", () => {
    it("referrer claims reward after funding pool", async () => {
      const { referral, owner, alice, carol } = await loadFixture(deployFixture);
      const reward = await referral.read.REWARD_PER_REFERRAL();
      await referral.write.recordReferral([alice.account.address, carol.account.address]);

      // Fund the contract
      await owner.sendTransaction({ to: referral.address, value: reward });

      const publicClient = await hre.viem.getPublicClient();
      const balBefore = await publicClient.getBalance({ address: alice.account.address });
      await referral.write.claimReward({ account: alice.account });
      const balAfter = await publicClient.getBalance({ address: alice.account.address });

      expect((balAfter > balBefore)).to.be.true;
    });

    it("reverts when no reward pending", async () => {
      const { referral, alice } = await loadFixture(deployFixture);
      await expect(
        referral.write.claimReward({ account: alice.account })
      ).to.be.rejectedWith("NoRewardPending");
    });

    it("clears pendingReward after claim", async () => {
      const { referral, owner, alice, carol } = await loadFixture(deployFixture);
      const reward = await referral.read.REWARD_PER_REFERRAL();
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      await owner.sendTransaction({ to: referral.address, value: reward });
      await referral.write.claimReward({ account: alice.account });
      const stats = await referral.read.getStats([alice.account.address]);
      expect(stats.pendingReward).to.equal(0n);
    });

    it("accumulates claimedReward", async () => {
      const { referral, owner, alice, carol, dave } = await loadFixture(deployFixture);
      const reward = await referral.read.REWARD_PER_REFERRAL();
      await referral.write.recordReferral([alice.account.address, carol.account.address]);
      await referral.write.recordReferral([alice.account.address, dave.account.address]);
      await owner.sendTransaction({ to: referral.address, value: reward * 2n });
      await referral.write.claimReward({ account: alice.account });
      const stats = await referral.read.getStats([alice.account.address]);
      expect(stats.claimedReward).to.equal(reward * 2n);
    });
  });
});
