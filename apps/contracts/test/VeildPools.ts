import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, alice, bob, charlie, diana] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const registry = await hre.viem.deployContract("VeildRegistry");
  const pools    = await hre.viem.deployContract("VeildPools", [registry.address]);

  // Register alice as creator
  await registry.write.register(
    ["alice_art", "Alice Smith", "Digital artist.", "QmAlice", "Art & Design"],
    { account: alice.account }
  );

  return { registry, pools, owner, alice, bob, charlie, diana, publicClient };
}

const ONE_DAY   = 24 * 60 * 60;
const TWO_DAYS  = 2  * ONE_DAY;
const QUESTION  = "What inspires your art?";
const ANSWER    = "The colours of the Celo ecosystem!";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VeildPools", function () {

  // ── Deployment ──────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { pools, owner } = await loadFixture(deployFixture);
      expect(await pools.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("sets default platform fee to 500 bps (5%)", async function () {
      const { pools } = await loadFixture(deployFixture);
      expect(await pools.read.platformFeeBps()).to.equal(500n);
    });

    it("starts with zero pools", async function () {
      const { pools } = await loadFixture(deployFixture);
      expect(await pools.read.getPoolCount()).to.equal(0n);
    });
  });

  // ── Pool Creation ────────────────────────────────────────────────────────────

  describe("createPool()", function () {
    it("creates a pool with correct fields", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.01");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   amount,
      });

      const pool = await pools.read.getPool([0n]);
      expect(pool.id).to.equal(0n);
      expect(pool.creator).to.equal(getAddress(alice.account.address));
      expect(pool.question).to.equal(QUESTION);
      expect(pool.totalFunded).to.equal(amount);
      expect(pool.status).to.equal(0); // Active
    });

    it("records the initial contribution", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.01");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   amount,
      });

      const contribs = await pools.read.getContributions([0n]);
      expect(contribs).to.have.length(1);
      expect(contribs[0].contributor).to.equal(getAddress(charlie.account.address));
      expect(contribs[0].amount).to.equal(amount);
      expect(contribs[0].refunded).to.be.false;
    });

    it("reverts if initial amount is below MIN_POOL_AMOUNT", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.0009"),
        })
      ).to.be.rejectedWith("TooSmall");
    });

    it("reverts if creator is not registered", async function () {
      const { pools, diana, charlie } = await loadFixture(deployFixture);

      await expect(
        pools.write.createPool([diana.account.address, QUESTION, BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("CreatorNotRegistered");
    });

    it("reverts if question is empty", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        pools.write.createPool([alice.account.address, "", BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("InvalidQuestion");
    });

    it("reverts if question exceeds 280 chars", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const longQ = "x".repeat(281);

      await expect(
        pools.write.createPool([alice.account.address, longQ, BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("InvalidQuestion");
    });

    it("reverts if duration is below 1 day", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY - 1)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("DeadlineOutOfRange");
    });

    it("reverts if duration exceeds 30 days", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const thirtyOneDays = 31 * ONE_DAY;

      await expect(
        pools.write.createPool([alice.account.address, QUESTION, BigInt(thirtyOneDays)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("DeadlineOutOfRange");
    });

    it("emits PoolCreated event", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      const events = await pools.getEvents.PoolCreated();
      expect(events).to.have.length(1);
      expect(events[0].args.creator).to.equal(getAddress(alice.account.address));
      expect(events[0].args.starter).to.equal(getAddress(charlie.account.address));
      expect(events[0].args.question).to.equal(QUESTION);
    });

    it("increments pool counter", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.createPool([alice.account.address, "Another Q?", BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      expect(await pools.read.getPoolCount()).to.equal(2n);
    });
  });

  // ── Contributions ────────────────────────────────────────────────────────────

  describe("contribute()", function () {
    it("fan can add to an existing pool", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.contribute([0n], {
        account: diana.account,
        value:   parseEther("0.02"),
      });

      const pool = await pools.read.getPool([0n]);
      expect(pool.totalFunded).to.equal(parseEther("0.03"));
    });

    it("records multiple contributions", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.contribute([0n], {
        account: diana.account,
        value:   parseEther("0.02"),
      });

      const contribs = await pools.read.getContributions([0n]);
      expect(contribs).to.have.length(2);
    });

    it("reverts if pool does not exist", async function () {
      const { pools, charlie } = await loadFixture(deployFixture);

      await expect(
        pools.write.contribute([99n], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("PoolNotFound");
    });

    it("reverts if contribution is below minimum", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await expect(
        pools.write.contribute([0n], {
          account: diana.account,
          value:   parseEther("0.0004"),
        })
      ).to.be.rejectedWith("TooSmall");
    });

    it("reverts if pool deadline has passed", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);

      await expect(
        pools.write.contribute([0n], {
          account: diana.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejectedWith("PoolDeadlinePassed");
    });

    it("emits PoolContribution event", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.contribute([0n], {
        account: diana.account,
        value:   parseEther("0.02"),
      });

      const events = await pools.getEvents.PoolContribution();
      expect(events).to.have.length(1);
      expect(events[0].args.contributor).to.equal(getAddress(diana.account.address));
    });
  });

  // ── Answering ────────────────────────────────────────────────────────────────

  describe("answerPool()", function () {
    it("creator can answer an active pool and receive payout", async function () {
      const { pools, alice, charlie, publicClient } = await loadFixture(deployFixture);
      const amount = parseEther("0.1");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   amount,
      });

      const before = await publicClient.getBalance({ address: alice.account.address });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });
      const after = await publicClient.getBalance({ address: alice.account.address });

      expect(after > before).to.be.true;
    });

    it("pool status changes to Answered", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });

      const pool = await pools.read.getPool([0n]);
      expect(pool.status).to.equal(1); // Answered
      expect(pool.answer).to.equal(ANSWER);
    });

    it("accrues platform fees on answer", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.1");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   amount,
      });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });

      const expectedFee = (amount * 500n) / 10_000n;
      expect(await pools.read.platformFeesAccrued()).to.equal(expectedFee);
    });

    it("reverts if called by non-creator", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await expect(
        pools.write.answerPool([0n, ANSWER], { account: diana.account })
      ).to.be.rejectedWith("NotCreator");
    });

    it("reverts if pool deadline has passed", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);

      await expect(
        pools.write.answerPool([0n, ANSWER], { account: alice.account })
      ).to.be.rejectedWith("PoolDeadlinePassed");
    });

    it("reverts if answer is empty", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await expect(
        pools.write.answerPool([0n, ""], { account: alice.account })
      ).to.be.rejectedWith("InvalidAnswer");
    });

    it("reverts if pool is already answered", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });
      await expect(
        pools.write.answerPool([0n, ANSWER], { account: alice.account })
      ).to.be.rejectedWith("PoolNotActive");
    });

    it("emits PoolAnswered event", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.1");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   amount,
      });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });

      const events = await pools.getEvents.PoolAnswered();
      expect(events).to.have.length(1);
      expect(events[0].args.creator).to.equal(getAddress(alice.account.address));
    });
  });

  // ── Expiry & Refunds ─────────────────────────────────────────────────────────

  describe("markExpired() and claimRefund()", function () {
    it("anyone can mark an expired pool as Expired", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);
      await pools.write.markExpired([0n], { account: diana.account });

      const pool = await pools.read.getPool([0n]);
      expect(pool.status).to.equal(2); // Expired
    });

    it("reverts markExpired before deadline", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await expect(
        pools.write.markExpired([0n], { account: diana.account })
      ).to.be.rejectedWith("PoolNotFinished");
    });

    it("contributor can claim refund after pool expires", async function () {
      const { pools, alice, charlie, publicClient } = await loadFixture(deployFixture);
      const amount = parseEther("0.05");

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   amount,
      });

      await time.increase(ONE_DAY + 1);
      await pools.write.markExpired([0n], { account: charlie.account });

      const before = await publicClient.getBalance({ address: charlie.account.address });
      await pools.write.claimRefund([0n, 0n], { account: charlie.account });
      const after = await publicClient.getBalance({ address: charlie.account.address });

      expect(after > before).to.be.true;
    });

    it("marks contribution as refunded", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);
      await pools.write.markExpired([0n], { account: charlie.account });
      await pools.write.claimRefund([0n, 0n], { account: charlie.account });

      const contribs = await pools.read.getContributions([0n]);
      expect(contribs[0].refunded).to.be.true;
    });

    it("reverts double refund", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);
      await pools.write.markExpired([0n], { account: charlie.account });
      await pools.write.claimRefund([0n, 0n], { account: charlie.account });
      await expect(
        pools.write.claimRefund([0n, 0n], { account: charlie.account })
      ).to.be.rejectedWith("AlreadyRefunded");
    });

    it("reverts claimRefund from non-contributor", async function () {
      const { pools, alice, charlie, diana } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(ONE_DAY)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });

      await time.increase(ONE_DAY + 1);
      await pools.write.markExpired([0n], { account: charlie.account });
      await expect(
        pools.write.claimRefund([0n, 0n], { account: diana.account })
      ).to.be.rejectedWith("NoContribution");
    });

    it("reverts claimRefund on an active pool", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await expect(
        pools.write.claimRefund([0n, 0n], { account: charlie.account })
      ).to.be.rejectedWith("PoolNotFinished");
    });
  });

  // ── Admin ────────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("owner can cancel an active pool", async function () {
      const { pools, alice, charlie, owner } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.cancelPool([0n], { account: owner.account });

      const pool = await pools.read.getPool([0n]);
      expect(pool.status).to.equal(3); // Cancelled
    });

    it("contributors can refund from a cancelled pool", async function () {
      const { pools, alice, charlie, owner, publicClient } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.05"),
      });
      await pools.write.cancelPool([0n], { account: owner.account });

      const before = await publicClient.getBalance({ address: charlie.account.address });
      await pools.write.claimRefund([0n, 0n], { account: charlie.account });
      const after = await publicClient.getBalance({ address: charlie.account.address });
      expect(after > before).to.be.true;
    });

    it("owner can update platform fee", async function () {
      const { pools, owner } = await loadFixture(deployFixture);
      await pools.write.setPlatformFee([300n], { account: owner.account });
      expect(await pools.read.platformFeeBps()).to.equal(300n);
    });

    it("reverts if platform fee exceeds 10%", async function () {
      const { pools, owner } = await loadFixture(deployFixture);
      await expect(
        pools.write.setPlatformFee([1001n], { account: owner.account })
      ).to.be.rejectedWith("FeeTooHigh");
    });

    it("owner can withdraw platform fees", async function () {
      const { pools, alice, charlie, owner, publicClient } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.1"),
      });
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });

      const before = await publicClient.getBalance({ address: owner.account.address });
      await pools.write.withdrawPlatformFees({ account: owner.account });
      const after = await publicClient.getBalance({ address: owner.account.address });
      expect(after > before).to.be.true;
    });

    it("getActivePools returns only active pools for a creator", async function () {
      const { pools, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      await pools.write.createPool([alice.account.address, "Another Q?", BigInt(TWO_DAYS)], {
        account: charlie.account,
        value:   parseEther("0.01"),
      });
      // Answer pool 0 — removes it from active
      await pools.write.answerPool([0n, ANSWER], { account: alice.account });

      const active = await pools.read.getActivePools([alice.account.address]);
      expect(active).to.have.length(1);
      expect(active[0].question).to.equal("Another Q?");
    });

    it("owner can pause and unpause", async function () {
      const { pools, owner, alice, charlie } = await loadFixture(deployFixture);

      await pools.write.pause({ account: owner.account });
      await expect(
        pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.be.rejected;

      await pools.write.unpause({ account: owner.account });
      await expect(
        pools.write.createPool([alice.account.address, QUESTION, BigInt(TWO_DAYS)], {
          account: charlie.account,
          value:   parseEther("0.01"),
        })
      ).to.not.be.rejected;
    });
  });
});
