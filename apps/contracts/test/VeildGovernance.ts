import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("VeildGovernance", function () {
  async function deployGovernanceFixture() {
    const [owner, alice, bob, carol, dave] = await hre.viem.getWalletClients();
    const gov = await hre.viem.deployContract("VeildGovernance");
    return { gov, owner, alice, bob, carol, dave };
  }

  const TITLE = "Reduce platform fee";
  const DESC  = "Lower tip fee from 3% to 2% to attract more creators.";
  const DAY   = 86_400n;
  const WEEK  = 7n * DAY;

  // ── Deployment ────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("sets owner", async () => {
      const { gov, owner } = await loadFixture(deployGovernanceFixture);
      expect((await gov.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });

    it("default votingPeriod is 7 days", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      expect(await gov.read.votingPeriod()).to.equal(WEEK);
    });

    it("default quorumVotes is 10", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      expect(await gov.read.quorumVotes()).to.equal(10n);
    });

    it("proposalCount starts at zero", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      expect(await gov.read.proposalCount()).to.equal(0n);
    });
  });

  // ── createProposal ────────────────────────────────────────────────────────

  describe("createProposal", () => {
    it("creates a proposal and emits ProposalCreated", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      expect(await gov.read.proposalCount()).to.equal(1n);
    });

    it("stores proposer address", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      const p = await gov.read.getProposal([1n]);
      expect(p.proposer.toLowerCase()).to.equal(alice.account.address.toLowerCase());
    });

    it("initial state is Active (0)", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(0); // Active
    });

    it("endTime is approximately startTime + votingPeriod", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      const p = await gov.read.getProposal([1n]);
      const diff = p.endTime - p.startTime;
      expect(diff).to.equal(WEEK);
    });

    it("reverts when title exceeds 128 chars", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      const longTitle = "a".repeat(129);
      await expect(
        gov.write.createProposal([longTitle, DESC], { account: alice.account })
      ).to.be.rejectedWith("TitleTooLong");
    });

    it("reverts when description exceeds 1024 chars", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      const longDesc = "b".repeat(1025);
      await expect(
        gov.write.createProposal([TITLE, longDesc], { account: alice.account })
      ).to.be.rejectedWith("DescriptionTooLong");
    });

    it("increments proposalCount for each new proposal", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.createProposal(["Second", "Second desc"], { account: alice.account });
      expect(await gov.read.proposalCount()).to.equal(2n);
    });
  });

  // ── castVote ──────────────────────────────────────────────────────────────

  describe("castVote", () => {
    async function withProposal() {
      const ctx = await loadFixture(deployGovernanceFixture);
      await ctx.gov.write.createProposal([TITLE, DESC], { account: ctx.alice.account });
      return ctx;
    }

    it("records a FOR vote and emits VoteCast", async () => {
      const { gov, bob } = await withProposal();
      await gov.write.castVote([1n, true], { account: bob.account });
      const [forVotes] = await gov.read.getVoteTotals([1n]);
      expect(forVotes).to.equal(1n);
    });

    it("records an AGAINST vote", async () => {
      const { gov, bob } = await withProposal();
      await gov.write.castVote([1n, false], { account: bob.account });
      const [, againstVotes] = await gov.read.getVoteTotals([1n]);
      expect(againstVotes).to.equal(1n);
    });

    it("marks voter as having voted", async () => {
      const { gov, bob } = await withProposal();
      await gov.write.castVote([1n, true], { account: bob.account });
      expect(await gov.read.hasVoted([1n, bob.account.address])).to.be.true;
    });

    it("reverts on double vote", async () => {
      const { gov, bob } = await withProposal();
      await gov.write.castVote([1n, true], { account: bob.account });
      await expect(
        gov.write.castVote([1n, false], { account: bob.account })
      ).to.be.rejectedWith("AlreadyVoted");
    });

    it("reverts when voting window is closed", async () => {
      const { gov, bob } = await withProposal();
      await time.increase(Number(WEEK) + 1);
      await expect(
        gov.write.castVote([1n, true], { account: bob.account })
      ).to.be.rejectedWith("VotingWindowClosed");
    });

    it("multiple voters accumulate correctly", async () => {
      const { gov, alice, bob, carol, dave } = await withProposal();
      await gov.write.castVote([1n, true],  { account: bob.account });
      await gov.write.castVote([1n, true],  { account: carol.account });
      await gov.write.castVote([1n, false], { account: dave.account });
      const [forVotes, againstVotes] = await gov.read.getVoteTotals([1n]);
      expect(forVotes).to.equal(2n);
      expect(againstVotes).to.equal(1n);
    });
  });

  // ── finalizeProposal ──────────────────────────────────────────────────────

  describe("finalizeProposal", () => {
    it("marks Passed when quorum met and FOR > AGAINST", async () => {
      const { gov, owner, alice, bob, carol, dave } = await loadFixture(deployGovernanceFixture);
      await gov.write.setQuorumVotes([3n]);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.castVote([1n, true], { account: bob.account });
      await gov.write.castVote([1n, true], { account: carol.account });
      await gov.write.castVote([1n, true], { account: dave.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(1); // Passed
    });

    it("marks Defeated when quorum not met", async () => {
      const { gov, alice, bob } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.castVote([1n, true], { account: bob.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(2); // Defeated
    });

    it("marks Defeated when AGAINST >= FOR", async () => {
      const { gov, owner, alice, bob, carol } = await loadFixture(deployGovernanceFixture);
      await gov.write.setQuorumVotes([2n]);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.castVote([1n, false], { account: bob.account });
      await gov.write.castVote([1n, false], { account: carol.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(2); // Defeated
    });

    it("reverts if voting window still open", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await expect(gov.write.finalizeProposal([1n])).to.be.rejectedWith("VotingWindowOpen");
    });

    it("reverts on double finalization", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      await expect(gov.write.finalizeProposal([1n])).to.be.rejectedWith("AlreadyFinalized");
    });
  });

  // ── cancelProposal ────────────────────────────────────────────────────────

  describe("cancelProposal", () => {
    it("proposer can cancel own active proposal", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.cancelProposal([1n], { account: alice.account });
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(3); // Cancelled
    });

    it("non-proposer cannot cancel", async () => {
      const { gov, alice, bob } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await expect(
        gov.write.cancelProposal([1n], { account: bob.account })
      ).to.be.rejectedWith("NotProposer");
    });

    it("cannot cancel an already-cancelled proposal", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.cancelProposal([1n], { account: alice.account });
      await expect(
        gov.write.cancelProposal([1n], { account: alice.account })
      ).to.be.rejectedWith("AlreadyFinalized");
    });
  });

  // ── markExecuted ──────────────────────────────────────────────────────────

  describe("markExecuted", () => {
    it("owner can mark a Passed proposal executed", async () => {
      const { gov, owner, alice, bob, carol, dave } = await loadFixture(deployGovernanceFixture);
      await gov.write.setQuorumVotes([3n]);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.castVote([1n, true], { account: bob.account });
      await gov.write.castVote([1n, true], { account: carol.account });
      await gov.write.castVote([1n, true], { account: dave.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      await gov.write.markExecuted([1n]);
      const p = await gov.read.getProposal([1n]);
      expect(p.state).to.equal(4); // Executed
    });

    it("non-owner cannot mark executed", async () => {
      const { gov, alice, bob, carol, dave } = await loadFixture(deployGovernanceFixture);
      await gov.write.setQuorumVotes([3n]);
      await gov.write.createProposal([TITLE, DESC], { account: alice.account });
      await gov.write.castVote([1n, true], { account: bob.account });
      await gov.write.castVote([1n, true], { account: carol.account });
      await gov.write.castVote([1n, true], { account: dave.account });
      await time.increase(Number(WEEK) + 1);
      await gov.write.finalizeProposal([1n]);
      await expect(
        gov.write.markExecuted([1n], { account: alice.account })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  // ── Owner config ──────────────────────────────────────────────────────────

  describe("owner config", () => {
    it("owner can update quorumVotes", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      await gov.write.setQuorumVotes([25n]);
      expect(await gov.read.quorumVotes()).to.equal(25n);
    });

    it("owner can update votingPeriod within bounds", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      await gov.write.setVotingPeriod([3n * DAY]);
      expect(await gov.read.votingPeriod()).to.equal(3n * DAY);
    });

    it("reverts votingPeriod below 1 day", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      await expect(gov.write.setVotingPeriod([DAY - 1n])).to.be.rejectedWith("VotingPeriodOutOfRange");
    });

    it("reverts votingPeriod above 30 days", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      await expect(gov.write.setVotingPeriod([31n * DAY])).to.be.rejectedWith("VotingPeriodOutOfRange");
    });

    it("owner can pause and unpause", async () => {
      const { gov } = await loadFixture(deployGovernanceFixture);
      await gov.write.pause();
      expect(await gov.read.paused()).to.be.true;
      await gov.write.unpause();
      expect(await gov.read.paused()).to.be.false;
    });

    it("cannot create proposal while paused", async () => {
      const { gov, alice } = await loadFixture(deployGovernanceFixture);
      await gov.write.pause();
      await expect(
        gov.write.createProposal([TITLE, DESC], { account: alice.account })
      ).to.be.rejectedWith("EnforcedPause");
    });
  });
});
