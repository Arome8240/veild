import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("VeildStaking", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
    const registry = await hre.viem.deployContract("VeildRegistry");

    await registry.write.register(["alice", "Alice", "bio", "", "art"], { account: alice.account, value: 0n });

    const staking = await hre.viem.deployContract("VeildStaking", [registry.address]);
    return { staking, registry, owner, alice, bob, carol };
  }

  const STAKE = parseEther("0.1");
  const COOLDOWN = 7 * 24 * 3600; // 7 days

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("sets owner and registry", async () => {
      const { staking, registry, owner } = await loadFixture(deployFixture);
      expect((await staking.read.owner()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect((await staking.read.registry()).toLowerCase()).to.equal(registry.address.toLowerCase());
    });

    it("totalStaked starts at zero", async () => {
      const { staking } = await loadFixture(deployFixture);
      expect(await staking.read.totalStaked()).to.equal(0n);
    });
  });

  // ── stake ─────────────────────────────────────────────────────────────────

  describe("stake", () => {
    it("registered creator can stake", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      const s = await staking.read.getStake([alice.account.address]);
      expect(s.amount).to.equal(STAKE);
    });

    it("totalStaked increases", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      expect(await staking.read.totalStaked()).to.equal(STAKE);
    });

    it("boostScore equals staked amount", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      expect(await staking.read.boostScore([alice.account.address])).to.equal(STAKE);
    });

    it("multiple stakes accumulate", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.stake({ account: alice.account, value: STAKE });
      const s = await staking.read.getStake([alice.account.address]);
      expect(s.amount).to.equal(STAKE * 2n);
    });

    it("reverts for unregistered creator", async () => {
      const { staking, bob } = await loadFixture(deployFixture);
      await expect(
        staking.write.stake({ account: bob.account, value: STAKE })
      ).to.be.rejectedWith("NotRegistered");
    });

    it("reverts on zero value", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await expect(
        staking.write.stake({ account: alice.account, value: 0n })
      ).to.be.rejectedWith("ZeroAmount");
    });
  });

  // ── requestWithdraw ───────────────────────────────────────────────────────

  describe("requestWithdraw", () => {
    it("creator can request withdrawal after staking", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      const s = await staking.read.getStake([alice.account.address]);
      expect(s.withdrawPending).to.be.true;
    });

    it("reverts when nothing staked", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await expect(
        staking.write.requestWithdraw({ account: alice.account })
      ).to.be.rejectedWith("NothingStaked");
    });

    it("reverts on double request", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await expect(
        staking.write.requestWithdraw({ account: alice.account })
      ).to.be.rejectedWith("WithdrawAlreadyPending");
    });
  });

  // ── withdraw ──────────────────────────────────────────────────────────────

  describe("withdraw", () => {
    it("creator can withdraw after cooldown", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await time.increase(COOLDOWN + 1);
      const publicClient = await hre.viem.getPublicClient();
      const balBefore = await publicClient.getBalance({ address: alice.account.address });
      await staking.write.withdraw({ account: alice.account });
      const balAfter = await publicClient.getBalance({ address: alice.account.address });
      expect((balAfter > balBefore)).to.be.true;
    });

    it("stake amount zeroed after withdrawal", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await time.increase(COOLDOWN + 1);
      await staking.write.withdraw({ account: alice.account });
      const s = await staking.read.getStake([alice.account.address]);
      expect(s.amount).to.equal(0n);
    });

    it("totalStaked decreases after withdrawal", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await time.increase(COOLDOWN + 1);
      await staking.write.withdraw({ account: alice.account });
      expect(await staking.read.totalStaked()).to.equal(0n);
    });

    it("reverts before cooldown elapsed", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await time.increase(COOLDOWN - 100);
      await expect(
        staking.write.withdraw({ account: alice.account })
      ).to.be.rejectedWith("CooldownNotMet");
    });

    it("reverts with no pending withdrawal", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await expect(
        staking.write.withdraw({ account: alice.account })
      ).to.be.rejectedWith("NoWithdrawPending");
    });
  });

  // ── canWithdraw ───────────────────────────────────────────────────────────

  describe("canWithdraw", () => {
    it("returns false before cooldown", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      expect(await staking.read.canWithdraw([alice.account.address])).to.be.false;
    });

    it("returns true after cooldown", async () => {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.write.stake({ account: alice.account, value: STAKE });
      await staking.write.requestWithdraw({ account: alice.account });
      await time.increase(COOLDOWN + 1);
      expect(await staking.read.canWithdraw([alice.account.address])).to.be.true;
    });
  });
});
