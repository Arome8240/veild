import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("VeildAuction", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol, dave] = await hre.viem.getWalletClients();
    const registry = await hre.viem.deployContract("VeildRegistry");

    // Register alice as a creator
    await registry.write.register(
      ["alice", "Alice", "Creator bio", "", "art"],
      { account: alice.account, value: parseEther("0") }
    );

    const auction = await hre.viem.deployContract("VeildAuction", [registry.address]);
    return { auction, registry, owner, alice, bob, carol, dave };
  }

  const LABEL    = "Ask me anything — exclusive 1-on-1";
  const MIN_BID  = parseEther("0.01");
  const DURATION = 3600n; // 1 hour

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("sets owner and registry", async () => {
      const { auction, registry, owner } = await loadFixture(deployFixture);
      expect((await auction.read.owner()).toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect((await auction.read.registry()).toLowerCase()).to.equal(registry.address.toLowerCase());
    });

    it("auctionCount starts at zero", async () => {
      const { auction } = await loadFixture(deployFixture);
      expect(await auction.read.auctionCount()).to.equal(0n);
    });
  });

  // ── createAuction ─────────────────────────────────────────────────────────

  describe("createAuction", () => {
    it("registered creator can open an auction", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      expect(await auction.read.auctionCount()).to.equal(1n);
    });

    it("stores creator, label, minBid, endTime", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      const a = await auction.read.getAuction([1n]);
      expect(a.creator.toLowerCase()).to.equal(alice.account.address.toLowerCase());
      expect(a.label).to.equal(LABEL);
      expect(a.minBid).to.equal(MIN_BID);
      const diff = a.endTime - a.startTime;
      expect(diff).to.equal(DURATION);
    });

    it("initial state is Active (0)", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      const a = await auction.read.getAuction([1n]);
      expect(a.state).to.equal(0);
    });

    it("reverts for unregistered creator", async () => {
      const { auction, bob } = await loadFixture(deployFixture);
      await expect(
        auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: bob.account })
      ).to.be.rejectedWith("NotRegistered");
    });

    it("reverts when label too long", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await expect(
        auction.write.createAuction(["x".repeat(121), MIN_BID, DURATION], { account: alice.account })
      ).to.be.rejectedWith("LabelTooLong");
    });

    it("reverts when duration below 1 hour", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await expect(
        auction.write.createAuction([LABEL, MIN_BID, 3599n], { account: alice.account })
      ).to.be.rejectedWith("DurationOutOfRange");
    });

    it("reverts when minBid is zero", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await expect(
        auction.write.createAuction([LABEL, 0n, DURATION], { account: alice.account })
      ).to.be.rejectedWith("ZeroMinBid");
    });
  });

  // ── placeBid ──────────────────────────────────────────────────────────────

  describe("placeBid", () => {
    async function withAuction() {
      const ctx = await loadFixture(deployFixture);
      await ctx.auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: ctx.alice.account });
      return ctx;
    }

    it("fan can place opening bid at minBid", async () => {
      const { auction, bob } = await withAuction();
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      const a = await auction.read.getAuction([1n]);
      expect(a.highestBid).to.equal(MIN_BID);
      expect(a.highestBidder.toLowerCase()).to.equal(bob.account.address.toLowerCase());
    });

    it("outbid fan is refunded", async () => {
      const { auction, bob, carol } = await withAuction();
      const publicClient = await hre.viem.getPublicClient();
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      const balBefore = await publicClient.getBalance({ address: bob.account.address });
      const higherBid = parseEther("0.02");
      await auction.write.placeBid([1n], { account: carol.account, value: higherBid });
      const balAfter = await publicClient.getBalance({ address: bob.account.address });
      // Bob should have been refunded (net change close to 0, accounting for no gas)
      expect((balAfter > balBefore)).to.be.true;
    });

    it("reverts when bid below minBid", async () => {
      const { auction, bob } = await withAuction();
      await expect(
        auction.write.placeBid([1n], { account: bob.account, value: MIN_BID - 1n })
      ).to.be.rejectedWith("BidTooLow");
    });

    it("reverts when bid below 5% increment over current highest", async () => {
      const { auction, bob, carol } = await withAuction();
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await expect(
        auction.write.placeBid([1n], { account: carol.account, value: MIN_BID + 1n })
      ).to.be.rejectedWith("BidTooLow");
    });

    it("reverts after auction window closes", async () => {
      const { auction, bob } = await withAuction();
      await time.increase(Number(DURATION) + 1);
      await expect(
        auction.write.placeBid([1n], { account: bob.account, value: MIN_BID })
      ).to.be.rejectedWith("AuctionNotActive");
    });
  });

  // ── claimWin ──────────────────────────────────────────────────────────────

  describe("claimWin", () => {
    it("creator can claim after auction ends with a bid", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await time.increase(Number(DURATION) + 1);
      await auction.write.claimWin([1n], { account: alice.account });
      const a = await auction.read.getAuction([1n]);
      expect(a.claimed).to.be.true;
      expect(a.state).to.equal(1); // Ended
    });

    it("reverts before auction window closes", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await expect(
        auction.write.claimWin([1n], { account: alice.account })
      ).to.be.rejectedWith("AuctionNotEnded");
    });

    it("reverts on double claim", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await time.increase(Number(DURATION) + 1);
      await auction.write.claimWin([1n], { account: alice.account });
      await expect(
        auction.write.claimWin([1n], { account: alice.account })
      ).to.be.rejectedWith("AlreadyClaimed");
    });

    it("non-creator cannot claim", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await time.increase(Number(DURATION) + 1);
      await expect(
        auction.write.claimWin([1n], { account: bob.account })
      ).to.be.rejectedWith("NotCreator");
    });
  });

  // ── cancelAuction ─────────────────────────────────────────────────────────

  describe("cancelAuction", () => {
    it("creator cancels auction with no bids", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.cancelAuction([1n], { account: alice.account });
      const a = await auction.read.getAuction([1n]);
      expect(a.state).to.equal(2); // Cancelled
    });

    it("cannot cancel once a bid has been placed", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await auction.write.placeBid([1n], { account: bob.account, value: MIN_BID });
      await expect(
        auction.write.cancelAuction([1n], { account: alice.account })
      ).to.be.rejectedWith("HasBids");
    });

    it("non-creator cannot cancel", async () => {
      const { auction, alice, bob } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await expect(
        auction.write.cancelAuction([1n], { account: bob.account })
      ).to.be.rejectedWith("NotCreator");
    });
  });

  // ── isActive ──────────────────────────────────────────────────────────────

  describe("isActive", () => {
    it("returns true within window", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      expect(await auction.read.isActive([1n])).to.be.true;
    });

    it("returns false after window", async () => {
      const { auction, alice } = await loadFixture(deployFixture);
      await auction.write.createAuction([LABEL, MIN_BID, DURATION], { account: alice.account });
      await time.increase(Number(DURATION) + 1);
      expect(await auction.read.isActive([1n])).to.be.false;
    });
  });
});
