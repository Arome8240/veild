import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("VeildGifts", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
    const registry = await hre.viem.deployContract("VeildRegistry");

    await registry.write.register(["alice", "Alice", "bio", "", "art"], { account: alice.account, value: 0n });

    const gifts = await hre.viem.deployContract("VeildGifts", [registry.address]);
    return { gifts, registry, owner, alice, bob, carol };
  }

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("seeds 5 default gift types", async () => {
      const { gifts } = await loadFixture(deployFixture);
      expect(await gifts.read.giftTypeCount()).to.equal(5n);
    });

    it("first gift type is Rose at 0.001 CELO", async () => {
      const { gifts } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      expect(rose.name).to.equal("Rose");
      expect(rose.price).to.equal(parseEther("0.001"));
      expect(rose.active).to.be.true;
    });
  });

  // ── sendGift ──────────────────────────────────────────────────────────────

  describe("sendGift", () => {
    it("fan can send a gift at exact price", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await gifts.write.sendGift([alice.account.address, 1n, "Keep it up!"], {
        account: bob.account,
        value: rose.price,
      });
      const g = await gifts.read.getGifts([alice.account.address]);
      expect(g.length).to.equal(1);
      expect(g[0].giftTypeId).to.equal(1n);
    });

    it("credits creator earnings minus fee", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await gifts.write.sendGift([alice.account.address, 1n, ""], {
        account: bob.account,
        value: rose.price,
      });
      const earnings = await gifts.read.earnings([alice.account.address]);
      const feeBps   = await gifts.read.PLATFORM_FEE_BPS();
      const base     = await gifts.read.BPS_BASE();
      const expected = rose.price - (rose.price * feeBps) / base;
      expect(earnings).to.equal(expected);
    });

    it("reverts when value does not match price", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await expect(
        gifts.write.sendGift([alice.account.address, 1n, ""], {
          account: bob.account,
          value: rose.price - 1n,
        })
      ).to.be.rejectedWith("IncorrectValue");
    });

    it("reverts for unregistered creator", async () => {
      const { gifts, bob, carol } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await expect(
        gifts.write.sendGift([carol.account.address, 1n, ""], {
          account: bob.account,
          value: rose.price,
        })
      ).to.be.rejectedWith("NotRegistered");
    });

    it("reverts for invalid giftTypeId = 0", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      await expect(
        gifts.write.sendGift([alice.account.address, 0n, ""], {
          account: bob.account,
          value: parseEther("0.001"),
        })
      ).to.be.rejectedWith("InvalidGiftType");
    });

    it("reverts when message too long", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await expect(
        gifts.write.sendGift([alice.account.address, 1n, "x".repeat(141)], {
          account: bob.account,
          value: rose.price,
        })
      ).to.be.rejectedWith("MessageTooLong");
    });
  });

  // ── claimEarnings ─────────────────────────────────────────────────────────

  describe("claimEarnings", () => {
    it("creator claims accumulated earnings", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await gifts.write.sendGift([alice.account.address, 1n, ""], {
        account: bob.account,
        value: rose.price,
      });
      const publicClient = await hre.viem.getPublicClient();
      const balBefore = await publicClient.getBalance({ address: alice.account.address });
      await gifts.write.claimEarnings({ account: alice.account });
      const balAfter = await publicClient.getBalance({ address: alice.account.address });
      expect((balAfter > balBefore)).to.be.true;
    });

    it("clears earnings after claim", async () => {
      const { gifts, alice, bob } = await loadFixture(deployFixture);
      const rose = await gifts.read.getGiftType([1n]);
      await gifts.write.sendGift([alice.account.address, 1n, ""], {
        account: bob.account,
        value: rose.price,
      });
      await gifts.write.claimEarnings({ account: alice.account });
      expect(await gifts.read.earnings([alice.account.address])).to.equal(0n);
    });

    it("reverts when no earnings", async () => {
      const { gifts, alice } = await loadFixture(deployFixture);
      await expect(
        gifts.write.claimEarnings({ account: alice.account })
      ).to.be.rejectedWith("NoEarnings");
    });
  });

  // ── owner gift type management ────────────────────────────────────────────

  describe("addGiftType", () => {
    it("owner can add a new gift type", async () => {
      const { gifts } = await loadFixture(deployFixture);
      await gifts.write.addGiftType(["Trophy", parseEther("0.2")]);
      expect(await gifts.read.giftTypeCount()).to.equal(6n);
      const t = await gifts.read.getGiftType([6n]);
      expect(t.name).to.equal("Trophy");
    });

    it("reverts on zero price", async () => {
      const { gifts } = await loadFixture(deployFixture);
      await expect(gifts.write.addGiftType(["Zero", 0n])).to.be.rejectedWith("ZeroPrice");
    });
  });

  describe("updateGiftType", () => {
    it("owner can deactivate a gift type", async () => {
      const { gifts } = await loadFixture(deployFixture);
      await gifts.write.updateGiftType([1n, parseEther("0.001"), false]);
      const rose = await gifts.read.getGiftType([1n]);
      expect(rose.active).to.be.false;
    });
  });
});
