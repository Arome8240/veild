import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, alice, bob, charlie, diana] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const registry      = await hre.viem.deployContract("VeildRegistry");
  const subscriptions = await hre.viem.deployContract("VeildSubscriptions", [registry.address]);

  // Register alice and bob as creators
  await registry.write.register(
    ["alice_art", "Alice Smith", "Digital artist.", "QmAlice", "Art & Design"],
    { account: alice.account }
  );
  await registry.write.register(
    ["bob_tech", "Bob Jones", "Tech educator.", "QmBob", "Tech & Education"],
    { account: bob.account }
  );

  return { registry, subscriptions, owner, alice, bob, charlie, diana, publicClient };
}

const THIRTY_DAYS = 30 * 24 * 60 * 60; // seconds

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VeildSubscriptions", function () {

  // ── Deployment ──────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { subscriptions, owner } = await loadFixture(deployFixture);
      expect(await subscriptions.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("sets default platform fee to 500 bps (5%)", async function () {
      const { subscriptions } = await loadFixture(deployFixture);
      expect(await subscriptions.read.platformFeeBps()).to.equal(500n);
    });

    it("stores the registry address", async function () {
      const { subscriptions, registry } = await loadFixture(deployFixture);
      expect(await subscriptions.read.registry()).to.equal(getAddress(registry.address));
    });
  });

  // ── Tier Management ─────────────────────────────────────────────────────────

  describe("createTier()", function () {
    it("allows a registered creator to create a tier", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier(
        [parseEther("0.01"), "Fan"],
        { account: alice.account }
      );

      const tiers = await subscriptions.read.getTiers([alice.account.address]);
      expect(tiers).to.have.length(1);
      expect(tiers[0].label).to.equal("Fan");
      expect(tiers[0].pricePerMonth).to.equal(parseEther("0.01"));
      expect(tiers[0].isActive).to.be.true;
    });

    it("allows up to 3 tiers", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"],       { account: alice.account });
      await subscriptions.write.createTier([parseEther("0.05"), "Super Fan"], { account: alice.account });
      await subscriptions.write.createTier([parseEther("0.1"),  "VIP"],       { account: alice.account });

      expect(await subscriptions.read.getTierCount([alice.account.address])).to.equal(3n);
    });

    it("reverts on a 4th tier", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"],       { account: alice.account });
      await subscriptions.write.createTier([parseEther("0.05"), "Super Fan"], { account: alice.account });
      await subscriptions.write.createTier([parseEther("0.1"),  "VIP"],       { account: alice.account });

      await expect(
        subscriptions.write.createTier([parseEther("0.2"), "Ultra VIP"], { account: alice.account })
      ).to.be.rejectedWith("MaxTiersReached");
    });

    it("reverts if creator is not registered", async function () {
      const { subscriptions, charlie } = await loadFixture(deployFixture);

      await expect(
        subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: charlie.account })
      ).to.be.rejectedWith("CreatorNotRegistered");
    });

    it("reverts if label exceeds 32 chars", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);
      const longLabel = "x".repeat(33);

      await expect(
        subscriptions.write.createTier([parseEther("0.01"), longLabel], { account: alice.account })
      ).to.be.rejectedWith("LabelTooLong");
    });
  });

  describe("updateTierPrice()", function () {
    it("creator can update tier price", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.updateTierPrice([0n, parseEther("0.02")], { account: alice.account });

      const tiers = await subscriptions.read.getTiers([alice.account.address]);
      expect(tiers[0].pricePerMonth).to.equal(parseEther("0.02"));
    });

    it("reverts for non-existent tier", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await expect(
        subscriptions.write.updateTierPrice([0n, parseEther("0.02")], { account: alice.account })
      ).to.be.rejectedWith("TierNotFound");
    });
  });

  describe("deactivateTier()", function () {
    it("creator can deactivate a tier", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.deactivateTier([0n], { account: alice.account });

      const tiers = await subscriptions.read.getTiers([alice.account.address]);
      expect(tiers[0].isActive).to.be.false;
    });

    it("prevents new subscriptions to an inactive tier", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.deactivateTier([0n], { account: alice.account });

      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("TierInactive");
    });
  });

  // ── Subscribing ─────────────────────────────────────────────────────────────

  describe("subscribe()", function () {
    it("fan can subscribe to a creator tier", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      expect(await subscriptions.read.isSubscribed([alice.account.address, charlie.account.address])).to.be.true;
    });

    it("subscription is not active before payment", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      expect(await subscriptions.read.isSubscribed([alice.account.address, charlie.account.address])).to.be.false;
    });

    it("subscription expires after 30 days", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      await time.increase(THIRTY_DAYS + 1);
      expect(await subscriptions.read.isSubscribed([alice.account.address, charlie.account.address])).to.be.false;
    });

    it("renewing an active subscription extends the expiry", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const subBefore = await subscriptions.read.getSubscription([alice.account.address, charlie.account.address]);

      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const subAfter = await subscriptions.read.getSubscription([alice.account.address, charlie.account.address]);
      expect(subAfter.expiresAt > subBefore.expiresAt).to.be.true;
      expect(subAfter.renewals).to.equal(1n);
    });

    it("re-subscribing after expiry counts as a new subscription", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      await time.increase(THIRTY_DAYS + 1);
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const sub = await subscriptions.read.getSubscription([alice.account.address, charlie.account.address]);
      expect(sub.renewals).to.equal(0n); // fresh start
    });

    it("splits payment correctly between creator and platform", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);
      const price = parseEther("0.1");

      await subscriptions.write.createTier([price, "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: price,
      });

      const platformCut = (price * 500n) / 10_000n;
      const creatorCut  = price - platformCut;

      expect(await subscriptions.read.getEarnings([alice.account.address])).to.equal(creatorCut);
      expect(await subscriptions.read.platformFeesAccrued()).to.equal(platformCut);
    });

    it("increments subscriberCount only on first subscription", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      expect(await subscriptions.read.subscriberCount([alice.account.address])).to.equal(1n);
    });

    it("reverts if payment is insufficient", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: charlie.account,
          value: parseEther("0.005"),
        })
      ).to.be.rejectedWith("InsufficientPayment");
    });

    it("reverts if fan tries to subscribe to themselves", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: alice.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("CannotSubscribeToSelf");
    });

    it("reverts for non-existent tier", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("TierNotFound");
    });

    it("emits Subscribed event", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const events = await subscriptions.getEvents.Subscribed();
      expect(events).to.have.length(1);
      expect(events[0].args.creator).to.equal(getAddress(alice.account.address));
      expect(events[0].args.fan).to.equal(getAddress(charlie.account.address));
      expect(events[0].args.tierId).to.equal(0n);
    });

    it("emits Renewed event on renewal", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const events = await subscriptions.getEvents.Renewed();
      expect(events).to.have.length(1);
    });
  });

  // ── Claiming Earnings ───────────────────────────────────────────────────────

  describe("claimEarnings()", function () {
    it("creator can claim subscription revenue", async function () {
      const { subscriptions, alice, charlie, publicClient } = await loadFixture(deployFixture);
      const price = parseEther("0.1");

      await subscriptions.write.createTier([price, "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: price,
      });

      const before = await publicClient.getBalance({ address: alice.account.address });
      await subscriptions.write.claimEarnings({ account: alice.account });
      const after = await publicClient.getBalance({ address: alice.account.address });

      expect(after > before).to.be.true;
    });

    it("resets earnings to zero after claim", async function () {
      const { subscriptions, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await subscriptions.write.claimEarnings({ account: alice.account });

      expect(await subscriptions.read.getEarnings([alice.account.address])).to.equal(0n);
    });

    it("reverts when there are no earnings", async function () {
      const { subscriptions, alice } = await loadFixture(deployFixture);

      await expect(
        subscriptions.write.claimEarnings({ account: alice.account })
      ).to.be.rejectedWith("NoEarnings");
    });
  });

  // ── Admin ───────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("owner can update platform fee", async function () {
      const { subscriptions, owner } = await loadFixture(deployFixture);
      await subscriptions.write.setPlatformFee([300n], { account: owner.account });
      expect(await subscriptions.read.platformFeeBps()).to.equal(300n);
    });

    it("reverts if platform fee exceeds 10%", async function () {
      const { subscriptions, owner } = await loadFixture(deployFixture);
      await expect(
        subscriptions.write.setPlatformFee([1001n], { account: owner.account })
      ).to.be.rejectedWith("FeeTooHigh");
    });

    it("owner can withdraw platform fees", async function () {
      const { subscriptions, alice, charlie, owner, publicClient } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.1"), "Fan"], { account: alice.account });
      await subscriptions.write.subscribe([alice.account.address, 0n], {
        account: charlie.account,
        value: parseEther("0.1"),
      });

      const before = await publicClient.getBalance({ address: owner.account.address });
      await subscriptions.write.withdrawPlatformFees({ account: owner.account });
      const after = await publicClient.getBalance({ address: owner.account.address });
      expect(after > before).to.be.true;
    });

    it("owner can pause and unpause", async function () {
      const { subscriptions, owner, alice, charlie } = await loadFixture(deployFixture);

      await subscriptions.write.createTier([parseEther("0.01"), "Fan"], { account: alice.account });
      await subscriptions.write.pause({ account: owner.account });

      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejected;

      await subscriptions.write.unpause({ account: owner.account });
      await expect(
        subscriptions.write.subscribe([alice.account.address, 0n], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.not.be.rejected;
    });
  });
});
