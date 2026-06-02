import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// ─── Fixture ──────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, creator, fan, fan2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const registry  = await hre.viem.deployContract("VeildRegistry");
  const messaging = await hre.viem.deployContract("VeildMessages", [registry.address]);

  // Register creator
  const regAsCreator = await hre.viem.getContractAt("VeildRegistry", registry.address, {
    client: { wallet: creator },
  });
  await regAsCreator.write.register([
    "test_creator",
    "Test Creator",
    "A test bio",
    "QmAvatar",
    "Art",
  ]);

  const msgAsCreator = await hre.viem.getContractAt("VeildMessages", messaging.address, {
    client: { wallet: creator },
  });
  const msgAsFan = await hre.viem.getContractAt("VeildMessages", messaging.address, {
    client: { wallet: fan },
  });
  const msgAsFan2 = await hre.viem.getContractAt("VeildMessages", messaging.address, {
    client: { wallet: fan2 },
  });

  return {
    registry, messaging,
    owner, creator, fan, fan2,
    publicClient,
    msgAsCreator, msgAsFan, msgAsFan2,
  };
}

const PRIORITY_FEE = parseEther("0.001");
const MSG_CONTENT  = "What inspires your work?";
const REPLY_TEXT   = "Curiosity and community.";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VeildMessages", function () {

  describe("Deployment", function () {
    it("links to the registry", async function () {
      const { messaging, registry } = await loadFixture(deployFixture);
      expect(await messaging.read.registry()).to.equal(
        getAddress(registry.address)
      );
    });

    it("default priority fee is 0.001 ether", async function () {
      const { messaging } = await loadFixture(deployFixture);
      expect(await messaging.read.priorityFee()).to.equal(PRIORITY_FEE);
    });

    it("default platform fee is 500 bps (5%)", async function () {
      const { messaging } = await loadFixture(deployFixture);
      expect(await messaging.read.platformFeeBps()).to.equal(500n);
    });
  });

  // ─── sendMessage ───────────────────────────────────────────────────────────

  describe("sendMessage()", function () {
    it("adds a message to the creator's inbox", async function () {
      const { messaging, creator, msgAsFan } = await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);

      const inbox = await messaging.read.getInbox([creator.account.address]);
      expect(inbox).to.have.lengthOf(1);
      expect(inbox[0].content).to.equal(MSG_CONTENT);
      expect(inbox[0].isPriority).to.equal(false);
      expect(inbox[0].fee).to.equal(0n);
      expect(inbox[0].isAnswered).to.equal(false);
      expect(inbox[0].isPublished).to.equal(false);
      expect(inbox[0].isArchived).to.equal(false);
    });

    it("emits MessageSent event", async function () {
      const { messaging, creator, msgAsFan, publicClient } = await loadFixture(deployFixture);

      const hash = await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await messaging.getEvents.MessageSent();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.creator).to.equal(getAddress(creator.account.address));
      expect(events[0].args.isPriority).to.equal(false);
      expect(events[0].args.fee).to.equal(0n);
    });

    it("reverts for unregistered creator", async function () {
      const { msgAsFan, fan2 } = await loadFixture(deployFixture);

      await expect(
        msgAsFan.write.sendMessage([fan2.account.address, MSG_CONTENT])
      ).to.be.rejectedWith("CreatorNotRegistered");
    });

    it("reverts for empty content", async function () {
      const { creator, msgAsFan } = await loadFixture(deployFixture);
      await expect(
        msgAsFan.write.sendMessage([creator.account.address, ""])
      ).to.be.rejectedWith("ContentEmpty");
    });

    it("reverts for content exceeding 1000 bytes", async function () {
      const { creator, msgAsFan } = await loadFixture(deployFixture);
      const tooLong = "a".repeat(1001);
      await expect(
        msgAsFan.write.sendMessage([creator.account.address, tooLong])
      ).to.be.rejectedWith("ContentTooLong");
    });
  });

  // ─── sendPriorityMessage ───────────────────────────────────────────────────

  describe("sendPriorityMessage()", function () {
    it("adds a priority message and splits fee correctly", async function () {
      const { messaging, creator, msgAsFan } = await loadFixture(deployFixture);

      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, MSG_CONTENT],
        { value: PRIORITY_FEE }
      );

      const inbox = await messaging.read.getInbox([creator.account.address]);
      expect(inbox).to.have.lengthOf(1);
      expect(inbox[0].isPriority).to.equal(true);
      expect(inbox[0].fee).to.equal(PRIORITY_FEE);

      // 5% platform fee => 95% to creator
      const expectedCreatorCut = (PRIORITY_FEE * 9500n) / 10_000n;
      const earnings = await messaging.read.getEarnings([creator.account.address]);
      expect(earnings).to.equal(expectedCreatorCut);

      const platformFees = await messaging.read.platformFeesAccrued();
      expect(platformFees).to.equal(PRIORITY_FEE - expectedCreatorCut);
    });

    it("reverts if payment is below priority fee", async function () {
      const { creator, msgAsFan } = await loadFixture(deployFixture);
      await expect(
        msgAsFan.write.sendPriorityMessage(
          [creator.account.address, MSG_CONTENT],
          { value: parseEther("0.0001") }
        )
      ).to.be.rejectedWith("InsufficientPriorityFee");
    });

    it("accepts overpayment and credits surplus to creator", async function () {
      const { messaging, creator, msgAsFan } = await loadFixture(deployFixture);
      const bigPayment = parseEther("0.002"); // 2x priority fee

      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, MSG_CONTENT],
        { value: bigPayment }
      );

      const platformCut = (bigPayment * 500n) / 10_000n;
      const earnings = await messaging.read.getEarnings([creator.account.address]);
      expect(earnings).to.equal(bigPayment - platformCut);
    });
  });

  // ─── replyToMessage ────────────────────────────────────────────────────────

  describe("replyToMessage()", function () {
    it("creator can reply to a message", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, false]);

      const m = await messaging.read.getMessage([creator.account.address, 0n]);
      expect(m.isAnswered).to.equal(true);
      expect(m.reply).to.equal(REPLY_TEXT);
      expect(m.isPublished).to.equal(false);
    });

    it("can reply and publish in one call", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, true]);

      const m = await messaging.read.getMessage([creator.account.address, 0n]);
      expect(m.isAnswered).to.equal(true);
      expect(m.isPublished).to.equal(true);

      const wall = await messaging.read.getWall([creator.account.address]);
      expect(wall).to.have.lengthOf(1);
      expect(wall[0].question).to.equal(MSG_CONTENT);
      expect(wall[0].answer).to.equal(REPLY_TEXT);
    });

    it("reverts if already answered", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, false]);

      await expect(
        msgAsCreator.write.replyToMessage([0n, "Second reply", false])
      ).to.be.rejectedWith("MessageAlreadyAnswered");
    });

    it("reverts if index out of bounds", async function () {
      const { creator, msgAsCreator } = await loadFixture(deployFixture);
      await expect(
        msgAsCreator.write.replyToMessage([99n, REPLY_TEXT, false])
      ).to.be.rejectedWith("IndexOutOfBounds");
    });

    it("reverts with empty reply", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await expect(
        msgAsCreator.write.replyToMessage([0n, "", false])
      ).to.be.rejectedWith("ContentEmpty");
    });
  });

  // ─── publishToWall ─────────────────────────────────────────────────────────

  describe("publishToWall()", function () {
    it("adds an answered message to the public wall", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, false]);
      await msgAsCreator.write.publishToWall([0n]);

      const wall = await messaging.read.getWall([creator.account.address]);
      expect(wall).to.have.lengthOf(1);
      expect(wall[0].question).to.equal(MSG_CONTENT);
      expect(wall[0].answer).to.equal(REPLY_TEXT);
      expect(wall[0].likes).to.equal(0n);
    });

    it("reverts if message is not answered", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);

      await expect(
        msgAsCreator.write.publishToWall([0n])
      ).to.be.rejectedWith("MessageNotAnswered");
    });

    it("reverts if already published", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, false]);
      await msgAsCreator.write.publishToWall([0n]);

      await expect(
        msgAsCreator.write.publishToWall([0n])
      ).to.be.rejectedWith("MessageAlreadyPublished");
    });
  });

  // ─── archiveMessage ────────────────────────────────────────────────────────

  describe("archiveMessage()", function () {
    it("marks a message as archived", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.archiveMessage([0n]);

      const m = await messaging.read.getMessage([creator.account.address, 0n]);
      expect(m.isArchived).to.equal(true);
    });

    it("reverts if already archived", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.archiveMessage([0n]);

      await expect(
        msgAsCreator.write.archiveMessage([0n])
      ).to.be.rejectedWith("MessageArchived_");
    });
  });

  // ─── likeWallPost ──────────────────────────────────────────────────────────

  describe("likeWallPost()", function () {
    it("increments like count", async function () {
      const { messaging, creator, msgAsFan, msgAsFan2, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, true]);

      await msgAsFan.write.likeWallPost([creator.account.address, 0n]);
      await msgAsFan2.write.likeWallPost([creator.account.address, 0n]);

      const wall = await messaging.read.getWall([creator.account.address]);
      expect(wall[0].likes).to.equal(2n);
    });

    it("reverts if same address likes twice", async function () {
      const { creator, msgAsFan, msgAsCreator } = await loadFixture(deployFixture);
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, true]);
      await msgAsFan.write.likeWallPost([creator.account.address, 0n]);

      await expect(
        msgAsFan.write.likeWallPost([creator.account.address, 0n])
      ).to.be.rejectedWith("AlreadyLiked");
    });

    it("hasLiked() returns correct state", async function () {
      const { messaging, creator, msgAsFan, msgAsFan2, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, true]);
      await msgAsFan.write.likeWallPost([creator.account.address, 0n]);

      expect(
        await messaging.read.hasLiked([creator.account.address, 0n, fan.account.address])
      ).to.equal(true);
      expect(
        await messaging.read.hasLiked([creator.account.address, 0n, fan2.account.address])
      ).to.equal(false);
    });
  });

  // ─── claimEarnings ─────────────────────────────────────────────────────────

  describe("claimEarnings()", function () {
    it("creator can claim their earnings", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator, publicClient } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, MSG_CONTENT],
        { value: PRIORITY_FEE }
      );

      const balanceBefore = await publicClient.getBalance({
        address: creator.account.address,
      });

      const hash = await msgAsCreator.write.claimEarnings();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      const balanceAfter = await publicClient.getBalance({
        address: creator.account.address,
      });

      const expectedCut = (PRIORITY_FEE * 9500n) / 10_000n;
      expect(balanceAfter).to.equal(balanceBefore + expectedCut - gasUsed);
    });

    it("resets earnings to zero after claim", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, MSG_CONTENT],
        { value: PRIORITY_FEE }
      );
      await msgAsCreator.write.claimEarnings();

      expect(await messaging.read.getEarnings([creator.account.address])).to.equal(0n);
    });

    it("reverts when there are no earnings", async function () {
      const { msgAsCreator } = await loadFixture(deployFixture);
      await expect(msgAsCreator.write.claimEarnings()).to.be.rejectedWith(
        "NoEarningsToWithdraw"
      );
    });
  });

  // ─── getInboxStats ─────────────────────────────────────────────────────────

  describe("getInboxStats()", function () {
    it("returns accurate stats across multiple messages", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      // 3 free messages
      for (let i = 0; i < 3; i++) {
        await msgAsFan.write.sendMessage([creator.account.address, `Question ${i}`]);
      }
      // 1 priority message
      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, "Priority question"],
        { value: PRIORITY_FEE }
      );

      // reply + publish one
      await msgAsCreator.write.replyToMessage([0n, REPLY_TEXT, true]);
      // archive one
      await msgAsCreator.write.archiveMessage([1n]);

      const stats = await messaging.read.getInboxStats([creator.account.address]);
      expect(stats.total).to.equal(4n);         // all 4 messages
      expect(stats.unread).to.equal(2n);        // msg[2] and msg[3] unanswered, non-archived
      expect(stats.priorityCount).to.equal(1n); // msg[3]
      expect(stats.publishedCount).to.equal(1n);// msg[0]
    });
  });

  // ─── Admin ─────────────────────────────────────────────────────────────────

  describe("Admin functions", function () {
    it("owner can update priority fee", async function () {
      const { messaging } = await loadFixture(deployFixture);
      const newFee = parseEther("0.005");

      await messaging.write.setPriorityFee([newFee]);
      expect(await messaging.read.priorityFee()).to.equal(newFee);
    });

    it("owner can update platform fee up to 10%", async function () {
      const { messaging } = await loadFixture(deployFixture);
      await messaging.write.setPlatformFee([1000n]); // 10%
      expect(await messaging.read.platformFeeBps()).to.equal(1000n);
    });

    it("owner cannot set platform fee above 10%", async function () {
      const { messaging } = await loadFixture(deployFixture);
      await expect(
        messaging.write.setPlatformFee([1001n])
      ).to.be.rejectedWith("FeeTooHigh");
    });

    it("owner can withdraw platform fees", async function () {
      const { messaging, creator, msgAsFan, owner, publicClient } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendPriorityMessage(
        [creator.account.address, MSG_CONTENT],
        { value: PRIORITY_FEE }
      );

      const platformCut = (PRIORITY_FEE * 500n) / 10_000n;
      const balanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      const hash = await messaging.write.withdrawPlatformFees();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gas = receipt.gasUsed * receipt.effectiveGasPrice;

      const balanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });
      expect(balanceAfter).to.equal(balanceBefore + platformCut - gas);
      expect(await messaging.read.platformFeesAccrued()).to.equal(0n);
    });

    it("non-owner cannot call admin functions", async function () {
      const { messaging, fan } = await loadFixture(deployFixture);
      const msgAsFan = await hre.viem.getContractAt(
        "VeildMessages",
        messaging.address,
        { client: { wallet: fan } }
      );

      await expect(
        msgAsFan.write.setPriorityFee([parseEther("1")])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("owner can pause and unpause the contract", async function () {
      const { messaging, creator, msgAsFan } = await loadFixture(deployFixture);
      await messaging.write.pause();

      await expect(
        msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT])
      ).to.be.rejectedWith("EnforcedPause");

      await messaging.write.unpause();
      await msgAsFan.write.sendMessage([creator.account.address, MSG_CONTENT]);
      const inbox = await messaging.read.getInbox([creator.account.address]);
      expect(inbox).to.have.lengthOf(1);
    });
  });

  // ─── getLengths ────────────────────────────────────────────────────────────

  describe("getLengths()", function () {
    it("returns correct inbox and wall lengths", async function () {
      const { messaging, creator, msgAsFan, msgAsCreator } =
        await loadFixture(deployFixture);

      await msgAsFan.write.sendMessage([creator.account.address, "Q1"]);
      await msgAsFan.write.sendMessage([creator.account.address, "Q2"]);
      await msgAsCreator.write.replyToMessage([0n, "A1", true]);

      const [inboxLen, wallLen] = await messaging.read.getLengths([creator.account.address]);
      expect(inboxLen).to.equal(2n);
      expect(wallLen).to.equal(1n);
    });
  });
});

// helper references needed inside the test
let fan: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number];
let fan2: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number];
before(async function () {
  [, , fan, fan2] = await hre.viem.getWalletClients();
});
