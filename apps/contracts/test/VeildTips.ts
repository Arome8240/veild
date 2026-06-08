import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, alice, bob, charlie, diana] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const registry = await hre.viem.deployContract("VeildRegistry");
  const tips     = await hre.viem.deployContract("VeildTips", [registry.address]);

  // Register alice and bob as creators
  await registry.write.register(
    ["alice_art", "Alice Smith", "Digital artist.", "QmAlice", "Art & Design"],
    { account: alice.account }
  );
  await registry.write.register(
    ["bob_tech", "Bob Jones", "Tech educator.", "QmBob", "Tech & Education"],
    { account: bob.account }
  );

  return { registry, tips, owner, alice, bob, charlie, diana, publicClient };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VeildTips", function () {

  // ── Deployment ──────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { tips, owner } = await loadFixture(deployFixture);
      expect(await tips.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("sets default platform fee to 300 bps (3%)", async function () {
      const { tips } = await loadFixture(deployFixture);
      expect(await tips.read.platformFeeBps()).to.equal(300n);
    });

    it("stores the registry address", async function () {
      const { tips, registry } = await loadFixture(deployFixture);
      expect(await tips.read.registry()).to.equal(getAddress(registry.address));
    });
  });

  // ── Sending Tips ────────────────────────────────────────────────────────────

  describe("tip()", function () {
    it("allows a fan to tip a creator", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, "Love your work!"], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      expect(await tips.read.getTipCount([alice.account.address])).to.equal(1n);
    });

    it("records the correct tip amount and message", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.005");

      await tips.write.tip([alice.account.address, "GM!"], {
        account: charlie.account,
        value: amount,
      });

      const allTips = await tips.read.getTips([alice.account.address]);
      expect(allTips).to.have.length(1);
      expect(allTips[0].fan).to.equal(getAddress(charlie.account.address));
      expect(allTips[0].amount).to.equal(amount);
      expect(allTips[0].message).to.equal("GM!");
    });

    it("credits earnings to the creator after platform fee", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.01");

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: amount,
      });

      // 3% platform fee → creator gets 97%
      const expected = (amount * 9700n) / 10_000n;
      expect(await tips.read.getEarnings([alice.account.address])).to.equal(expected);
    });

    it("accrues platform fees correctly", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);
      const amount = parseEther("0.01");

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: amount,
      });

      const expectedFee = (amount * 300n) / 10_000n;
      expect(await tips.read.platformFeesAccrued()).to.equal(expectedFee);
    });

    it("reverts if tip is below MIN_TIP", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        tips.write.tip([alice.account.address, ""], {
          account: charlie.account,
          value: parseEther("0.0009"),
        })
      ).to.be.rejectedWith("TipTooSmall");
    });

    it("reverts if creator is not registered", async function () {
      const { tips, diana, charlie } = await loadFixture(deployFixture);

      await expect(
        tips.write.tip([diana.account.address, ""], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("CreatorNotRegistered");
    });

    it("reverts if fan tips themselves", async function () {
      const { tips, alice } = await loadFixture(deployFixture);

      await expect(
        tips.write.tip([alice.account.address, ""], {
          account: alice.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("CannotTipSelf");
    });

    it("reverts if message exceeds 140 bytes", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);
      const longMsg = "x".repeat(141);

      await expect(
        tips.write.tip([alice.account.address, longMsg], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("MessageTooLong");
    });

    it("accepts empty message", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);

      await expect(
        tips.write.tip([alice.account.address, ""], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.not.be.rejected;
    });

    it("accumulates multiple tips", async function () {
      const { tips, alice, charlie, diana } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, "tip 1"], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await tips.write.tip([alice.account.address, "tip 2"], {
        account: diana.account,
        value: parseEther("0.02"),
      });

      expect(await tips.read.getTipCount([alice.account.address])).to.equal(2n);
    });

    it("emits TipSent event", async function () {
      const { tips, alice, charlie, publicClient } = await loadFixture(deployFixture);

      const hash = await tips.write.tip([alice.account.address, "gm"], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const events = await tips.getEvents.TipSent();
      expect(events).to.have.length(1);
      expect(events[0].args.creator).to.equal(getAddress(alice.account.address));
      expect(events[0].args.fan).to.equal(getAddress(charlie.account.address));
    });
  });

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  describe("Leaderboard", function () {
    it("adds the first tipper to the leaderboard", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.01"),
      });

      const lb = await tips.read.getLeaderboard([alice.account.address]);
      expect(lb).to.have.length(1);
      expect(lb[0].fan).to.equal(getAddress(charlie.account.address));
    });

    it("sorts the leaderboard by cumulative tips descending", async function () {
      const { tips, alice, bob, charlie, diana } = await loadFixture(deployFixture);

      // charlie tips 0.01, diana tips 0.02
      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await tips.write.tip([alice.account.address, ""], {
        account: diana.account,
        value: parseEther("0.02"),
      });

      const lb = await tips.read.getLeaderboard([alice.account.address]);
      expect(lb[0].fan).to.equal(getAddress(diana.account.address));
      expect(lb[1].fan).to.equal(getAddress(charlie.account.address));
    });

    it("updates an existing fan's position after a second tip", async function () {
      const { tips, alice, charlie, diana } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await tips.write.tip([alice.account.address, ""], {
        account: diana.account,
        value: parseEther("0.02"),
      });
      // charlie tips again, overtaking diana
      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.02"),
      });

      const lb = await tips.read.getLeaderboard([alice.account.address]);
      expect(lb[0].fan).to.equal(getAddress(charlie.account.address));
    });

    it("tracks fanTotals correctly", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);
      const t1 = parseEther("0.01");
      const t2 = parseEther("0.02");

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: t1,
      });
      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: t2,
      });

      const total = await tips.read.fanTotals([alice.account.address, charlie.account.address]);
      expect(total).to.equal(t1 + t2);
    });
  });

  // ── Claiming Earnings ───────────────────────────────────────────────────────

  describe("claimEarnings()", function () {
    it("transfers earnings to the creator", async function () {
      const { tips, alice, charlie, publicClient } = await loadFixture(deployFixture);
      const amount = parseEther("0.1");

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: amount,
      });

      const before = await publicClient.getBalance({ address: alice.account.address });
      await tips.write.claimEarnings({ account: alice.account });
      const after = await publicClient.getBalance({ address: alice.account.address });

      // should receive roughly 97% of the tip (minus gas)
      expect(after).to.be.gt(before);
    });

    it("resets earnings to 0 after claim", async function () {
      const { tips, alice, charlie } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await tips.write.claimEarnings({ account: alice.account });

      expect(await tips.read.getEarnings([alice.account.address])).to.equal(0n);
    });

    it("reverts when there are no earnings", async function () {
      const { tips, alice } = await loadFixture(deployFixture);

      await expect(
        tips.write.claimEarnings({ account: alice.account })
      ).to.be.rejectedWith("NoEarnings");
    });
  });

  // ── Admin ───────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("owner can update platform fee", async function () {
      const { tips, owner } = await loadFixture(deployFixture);
      await tips.write.setPlatformFee([500n], { account: owner.account });
      expect(await tips.read.platformFeeBps()).to.equal(500n);
    });

    it("reverts if platform fee exceeds 10%", async function () {
      const { tips, owner } = await loadFixture(deployFixture);
      await expect(
        tips.write.setPlatformFee([1001n], { account: owner.account })
      ).to.be.rejectedWith("FeeTooHigh");
    });

    it("non-owner cannot set platform fee", async function () {
      const { tips, charlie } = await loadFixture(deployFixture);
      await expect(
        tips.write.setPlatformFee([100n], { account: charlie.account })
      ).to.be.rejected;
    });

    it("owner can withdraw platform fees", async function () {
      const { tips, alice, charlie, owner, publicClient } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.1"),
      });

      const before = await publicClient.getBalance({ address: owner.account.address });
      await tips.write.withdrawPlatformFees({ account: owner.account });
      const after = await publicClient.getBalance({ address: owner.account.address });
      expect(after).to.be.gt(before);
    });

    it("reverts withdrawPlatformFees when balance is zero", async function () {
      const { tips, owner } = await loadFixture(deployFixture);
      await expect(
        tips.write.withdrawPlatformFees({ account: owner.account })
      ).to.be.rejectedWith("NoEarnings");
    });

    it("owner can pause and unpause", async function () {
      const { tips, owner, alice, charlie } = await loadFixture(deployFixture);

      await tips.write.pause({ account: owner.account });
      await expect(
        tips.write.tip([alice.account.address, ""], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.be.rejected;

      await tips.write.unpause({ account: owner.account });
      await expect(
        tips.write.tip([alice.account.address, ""], {
          account: charlie.account,
          value: parseEther("0.01"),
        })
      ).to.not.be.rejected;
    });

    it("getTotalTipped returns cumulative tip amount", async function () {
      const { tips, alice, charlie, diana } = await loadFixture(deployFixture);

      await tips.write.tip([alice.account.address, ""], {
        account: charlie.account,
        value: parseEther("0.01"),
      });
      await tips.write.tip([alice.account.address, ""], {
        account: diana.account,
        value: parseEther("0.02"),
      });

      expect(await tips.read.getTotalTipped([alice.account.address])).to.equal(
        parseEther("0.03")
      );
    });
  });
});
