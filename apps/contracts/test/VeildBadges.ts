import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("VeildBadges", function () {
  async function deployBadgesFixture() {
    const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
    const badges = await hre.viem.deployContract("VeildBadges");
    return { badges, owner, alice, bob, carol };
  }

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("sets the deployer as owner", async () => {
      const { badges, owner } = await loadFixture(deployBadgesFixture);
      expect((await badges.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });

    it("is not paused initially", async () => {
      const { badges } = await loadFixture(deployBadgesFixture);
      expect(await badges.read.paused()).to.be.false;
    });

    it("MAX_BADGE_ID is 7", async () => {
      const { badges } = await loadFixture(deployBadgesFixture);
      expect(await badges.read.MAX_BADGE_ID()).to.equal(7n);
    });
  });

  // ── awardBadge ────────────────────────────────────────────────────────────

  describe("awardBadge", () => {
    it("owner can award a badge", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      expect(await badges.read.hasBadge([alice.account.address, 0n])).to.be.true;
    });

    it("emits BadgeAwarded event", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      const publicClient = await hre.viem.getPublicClient();
      const hash = await badges.write.awardBadge([alice.account.address, 0n]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await badges.getEvents.BadgeAwarded(
        {},
        { blockHash: receipt.blockHash }
      );
      expect(logs).to.have.length(1);
      expect(logs[0].args.badgeId).to.equal(0n);
    });

    it("non-owner cannot award a badge", async () => {
      const { badges, alice, bob } = await loadFixture(deployBadgesFixture);
      const badgesAsAlice = await hre.viem.getContractAt(
        "VeildBadges",
        badges.address,
        { client: { wallet: alice } }
      );
      await expect(
        badgesAsAlice.write.awardBadge([bob.account.address, 0n])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("reverts on badge ID > MAX_BADGE_ID", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await expect(
        badges.write.awardBadge([alice.account.address, 8n])
      ).to.be.rejectedWith("InvalidBadgeId");
    });

    it("reverts when awarding an already-owned badge", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 1n]);
      await expect(
        badges.write.awardBadge([alice.account.address, 1n])
      ).to.be.rejectedWith("AlreadyOwned");
    });

    it("getBadges returns awarded badge IDs", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 2n]);
      await badges.write.awardBadge([alice.account.address, 5n]);
      const owned = await badges.read.getBadges([alice.account.address]);
      expect(owned).to.deep.equal([2n, 5n]);
    });

    it("badgeCount reflects awarded badges", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      await badges.write.awardBadge([alice.account.address, 3n]);
      expect(await badges.read.badgeCount([alice.account.address])).to.equal(2n);
    });

    it("hasBadge returns false for unawarded badge", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      expect(await badges.read.hasBadge([alice.account.address, 4n])).to.be.false;
    });

    it("hasBadge returns false for invalid badge ID without reverting", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      expect(await badges.read.hasBadge([alice.account.address, 99n])).to.be.false;
    });
  });

  // ── awardBadges (batch) ───────────────────────────────────────────────────

  describe("awardBadges (batch)", () => {
    it("awards multiple badges in one tx", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadges([alice.account.address, [0n, 1n, 2n]]);
      expect(await badges.read.badgeCount([alice.account.address])).to.equal(3n);
    });

    it("skips already-owned badges instead of reverting", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      // 0 is already owned, should skip it and award 1 and 2
      await badges.write.awardBadges([alice.account.address, [0n, 1n, 2n]]);
      expect(await badges.read.badgeCount([alice.account.address])).to.equal(3n);
    });

    it("reverts if any ID > MAX_BADGE_ID", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await expect(
        badges.write.awardBadges([alice.account.address, [0n, 99n]])
      ).to.be.rejectedWith("InvalidBadgeId");
    });

    it("each award emits a BadgeAwarded event", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      const publicClient = await hre.viem.getPublicClient();
      const hash = await badges.write.awardBadges([
        alice.account.address,
        [3n, 4n, 5n],
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await badges.getEvents.BadgeAwarded(
        {},
        { blockHash: receipt.blockHash }
      );
      expect(logs).to.have.length(3);
    });
  });

  // ── revokeBadge ───────────────────────────────────────────────────────────

  describe("revokeBadge", () => {
    it("owner can revoke an owned badge", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      await badges.write.revokeBadge([alice.account.address, 0n]);
      expect(await badges.read.hasBadge([alice.account.address, 0n])).to.be.false;
    });

    it("emits BadgeRevoked event", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      const publicClient = await hre.viem.getPublicClient();
      const hash = await badges.write.revokeBadge([alice.account.address, 0n]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await badges.getEvents.BadgeRevoked(
        {},
        { blockHash: receipt.blockHash }
      );
      expect(logs).to.have.length(1);
    });

    it("removes badge from getBadges array on revoke", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadges([alice.account.address, [0n, 1n, 2n]]);
      await badges.write.revokeBadge([alice.account.address, 1n]);
      const owned = await badges.read.getBadges([alice.account.address]);
      expect(owned).to.not.include(1n);
      expect(owned).to.have.length(2);
    });

    it("decrements badgeCount after revoke", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadges([alice.account.address, [0n, 1n]]);
      await badges.write.revokeBadge([alice.account.address, 0n]);
      expect(await badges.read.badgeCount([alice.account.address])).to.equal(1n);
    });

    it("reverts revoking a not-owned badge", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await expect(
        badges.write.revokeBadge([alice.account.address, 0n])
      ).to.be.rejectedWith("NotOwned");
    });

    it("reverts revoking invalid badge ID", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await expect(
        badges.write.revokeBadge([alice.account.address, 99n])
      ).to.be.rejectedWith("InvalidBadgeId");
    });
  });

  // ── getBadgeBitmap ────────────────────────────────────────────────────────

  describe("getBadgeBitmap", () => {
    it("returns all-false for holder with no badges", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      const bitmap = await badges.read.getBadgeBitmap([alice.account.address]);
      expect(bitmap.every((v: boolean) => !v)).to.be.true;
    });

    it("sets correct slots for awarded badges", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadges([alice.account.address, [0n, 3n, 7n]]);
      const bitmap = await badges.read.getBadgeBitmap([alice.account.address]);
      expect(bitmap[0]).to.be.true;
      expect(bitmap[1]).to.be.false;
      expect(bitmap[3]).to.be.true;
      expect(bitmap[7]).to.be.true;
    });

    it("reflects revocation in bitmap", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 2n]);
      await badges.write.revokeBadge([alice.account.address, 2n]);
      const bitmap = await badges.read.getBadgeBitmap([alice.account.address]);
      expect(bitmap[2]).to.be.false;
    });
  });

  // ── Pause ─────────────────────────────────────────────────────────────────

  describe("pause / unpause", () => {
    it("owner can pause and unpause", async () => {
      const { badges } = await loadFixture(deployBadgesFixture);
      await badges.write.pause();
      expect(await badges.read.paused()).to.be.true;
      await badges.write.unpause();
      expect(await badges.read.paused()).to.be.false;
    });

    it("awardBadge reverts when paused", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.pause();
      await expect(
        badges.write.awardBadge([alice.account.address, 0n])
      ).to.be.rejectedWith("EnforcedPause");
    });

    it("revokeBadge still works when paused (emergency revoke)", async () => {
      const { badges, alice } = await loadFixture(deployBadgesFixture);
      await badges.write.awardBadge([alice.account.address, 0n]);
      await badges.write.pause();
      // revokeBadge is not guarded by whenNotPaused
      await badges.write.revokeBadge([alice.account.address, 0n]);
      expect(await badges.read.hasBadge([alice.account.address, 0n])).to.be.false;
    });
  });
});
