import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

// ─── Fixture ──────────────────────────────────────────────────────────────────

async function deployRegistryFixture() {
  const [owner, alice, bob, charlie] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const registry = await hre.viem.deployContract("VeildRegistry");

  return { registry, owner, alice, bob, charlie, publicClient };
}

const ALICE_PROFILE = {
  username:  "alice_art",
  name:      "Alice Smith",
  bio:       "Digital artist & creator.",
  avatarCID: "QmAliceAvatar",
  category:  "Art & Design",
};

const BOB_PROFILE = {
  username:  "bob_tech",
  name:      "Bob Jones",
  bio:       "Tech educator.",
  avatarCID: "QmBobAvatar",
  category:  "Tech & Education",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VeildRegistry", function () {

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { registry, owner } = await loadFixture(deployRegistryFixture);
      expect(await registry.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("starts with zero creators and zero registration fee", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      expect(await registry.read.totalCreators()).to.equal(0n);
      expect(await registry.read.registrationFee()).to.equal(0n);
    });
  });

  // ─── Registration ──────────────────────────────────────────────────────────

  describe("register()", function () {
    it("allows a new creator to register", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt(
        "VeildRegistry",
        registry.address,
        { client: { wallet: alice } }
      );

      await reg.write.register([
        ALICE_PROFILE.username,
        ALICE_PROFILE.name,
        ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID,
        ALICE_PROFILE.category,
      ]);

      expect(await registry.read.totalCreators()).to.equal(1n);
      expect(
        await registry.read.isRegistered([alice.account.address])
      ).to.equal(true);
    });

    it("emits CreatorRegistered event", async function () {
      const { registry, alice, publicClient } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });

      const hash = await reg.write.register([
        ALICE_PROFILE.username,
        ALICE_PROFILE.name,
        ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID,
        ALICE_PROFILE.category,
      ]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await registry.getEvents.CreatorRegistered();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.creator).to.equal(
        getAddress(alice.account.address)
      );
      expect(events[0].args.username).to.equal(ALICE_PROFILE.username);
    });

    it("stores profile data correctly", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await reg.write.register([
        ALICE_PROFILE.username,
        ALICE_PROFILE.name,
        ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID,
        ALICE_PROFILE.category,
      ]);

      const c = await registry.read.getCreator([alice.account.address]);
      expect(c.username).to.equal(ALICE_PROFILE.username);
      expect(c.name).to.equal(ALICE_PROFILE.name);
      expect(c.bio).to.equal(ALICE_PROFILE.bio);
      expect(c.avatarCID).to.equal(ALICE_PROFILE.avatarCID);
      expect(c.category).to.equal(ALICE_PROFILE.category);
      expect(c.isActive).to.equal(true);
      expect(c.isVerified).to.equal(false);
    });

    it("reverts if registering twice from same address", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await reg.write.register([
        ALICE_PROFILE.username,
        ALICE_PROFILE.name,
        ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID,
        ALICE_PROFILE.category,
      ]);

      await expect(
        reg.write.register([
          "alice_art2",
          ALICE_PROFILE.name,
          ALICE_PROFILE.bio,
          ALICE_PROFILE.avatarCID,
          ALICE_PROFILE.category,
        ])
      ).to.be.rejectedWith("AlreadyRegistered");
    });

    it("reverts if username is already taken", async function () {
      const { registry, alice, bob } = await loadFixture(deployRegistryFixture);

      const regAlice = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await regAlice.write.register([
        ALICE_PROFILE.username,
        ALICE_PROFILE.name,
        ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID,
        ALICE_PROFILE.category,
      ]);

      const regBob = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: bob },
      });
      await expect(
        regBob.write.register([
          ALICE_PROFILE.username, // same username
          BOB_PROFILE.name,
          BOB_PROFILE.bio,
          BOB_PROFILE.avatarCID,
          BOB_PROFILE.category,
        ])
      ).to.be.rejectedWith("UsernameTaken");
    });

    it("reverts if username is empty or too long", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });

      await expect(
        reg.write.register(["", ALICE_PROFILE.name, ALICE_PROFILE.bio, ALICE_PROFILE.avatarCID, ALICE_PROFILE.category])
      ).to.be.rejectedWith("InvalidUsername");

      await expect(
        reg.write.register([
          "this_username_is_way_too_long_for_veild_rules",
          ALICE_PROFILE.name, ALICE_PROFILE.bio, ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
        ])
      ).to.be.rejectedWith("InvalidUsername");
    });

    it("requires registration fee when set", async function () {
      const { registry, owner, alice } = await loadFixture(deployRegistryFixture);
      const fee = 10_000_000_000_000n; // 0.00001 ether

      // set fee as owner
      await registry.write.setRegistrationFee([fee]);

      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });

      // should fail without payment
      await expect(
        reg.write.register([
          ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
          ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
        ])
      ).to.be.rejectedWith("InsufficientFee");

      // should succeed with payment
      await reg.write.register(
        [ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
          ALICE_PROFILE.avatarCID, ALICE_PROFILE.category],
        { value: fee }
      );
      expect(await registry.read.isRegistered([alice.account.address])).to.equal(true);
    });
  });

  // ─── Profile update ────────────────────────────────────────────────────────

  describe("updateProfile()", function () {
    it("allows a registered creator to update their profile", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await reg.write.register([
        ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
      ]);

      await reg.write.updateProfile([
        "Alice Updated",
        "New bio here",
        "QmNewAvatar",
        "Music",
      ]);

      const c = await registry.read.getCreator([alice.account.address]);
      expect(c.name).to.equal("Alice Updated");
      expect(c.bio).to.equal("New bio here");
      expect(c.category).to.equal("Music");
    });

    it("reverts if caller is not registered", async function () {
      const { registry, bob } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: bob },
      });

      await expect(
        reg.write.updateProfile(["Bob", "bio", "cid", "Tech"])
      ).to.be.rejectedWith("NotRegistered");
    });
  });

  // ─── Username lookup ───────────────────────────────────────────────────────

  describe("getCreatorByUsername()", function () {
    it("returns the correct address and profile", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await reg.write.register([
        ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
      ]);

      const [addr, creator] = await registry.read.getCreatorByUsername([
        ALICE_PROFILE.username,
      ]);
      expect(addr).to.equal(getAddress(alice.account.address));
      expect(creator.username).to.equal(ALICE_PROFILE.username);
    });

    it("returns zero address for unknown username", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      const [addr] = await registry.read.getCreatorByUsername(["nobody"]);
      expect(addr).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  // ─── Owner actions ─────────────────────────────────────────────────────────

  describe("setVerified()", function () {
    it("owner can verify a creator", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await reg.write.register([
        ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
      ]);

      await registry.write.setVerified([alice.account.address, true]);

      const c = await registry.read.getCreator([alice.account.address]);
      expect(c.isVerified).to.equal(true);
    });

    it("non-owner cannot verify", async function () {
      const { registry, alice, bob } = await loadFixture(deployRegistryFixture);
      const regBob = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: bob },
      });

      await expect(
        regBob.write.setVerified([alice.account.address, true])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("getCreatorList()", function () {
    it("paginates creators correctly", async function () {
      const { registry, alice, bob, charlie } = await loadFixture(deployRegistryFixture);

      for (const [wallet, username] of [
        [alice, "alice_art"],
        [bob, "bob_tech"],
        [charlie, "charlie_music"],
      ] as const) {
        const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
          client: { wallet },
        });
        await reg.write.register([username, "Name", "Bio", "CID", "Category"]);
      }

      const page1 = await registry.read.getCreatorList([0n, 2n]);
      expect(page1).to.have.lengthOf(2);

      const page2 = await registry.read.getCreatorList([2n, 2n]);
      expect(page2).to.have.lengthOf(1);

      const beyond = await registry.read.getCreatorList([10n, 5n]);
      expect(beyond).to.have.lengthOf(0);
    });
  });

  describe("pause/unpause", function () {
    it("owner can pause and prevent registration", async function () {
      const { registry, alice } = await loadFixture(deployRegistryFixture);
      await registry.write.pause();

      const reg = await hre.viem.getContractAt("VeildRegistry", registry.address, {
        client: { wallet: alice },
      });
      await expect(
        reg.write.register([
          ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
          ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
        ])
      ).to.be.rejectedWith("EnforcedPause");

      await registry.write.unpause();
      await reg.write.register([
        ALICE_PROFILE.username, ALICE_PROFILE.name, ALICE_PROFILE.bio,
        ALICE_PROFILE.avatarCID, ALICE_PROFILE.category,
      ]);
      expect(await registry.read.isRegistered([alice.account.address])).to.equal(true);
    });
  });
});
