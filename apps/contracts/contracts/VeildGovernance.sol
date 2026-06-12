// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeildGovernance
 * @notice On-chain governance for the Veild platform. Registered creators
 *         submit proposals; any address may vote FOR or AGAINST within the
 *         voting window. Proposals that reach quorum and a majority FOR
 *         are marked Passed; the owner can then execute them off-chain.
 *
 * Quorum model
 * ────────────
 * • quorumVotes: minimum total votes (FOR + AGAINST) required for validity.
 * • A proposal passes when it meets quorum AND forVotes > againstVotes.
 * • Voting power is 1 vote per address (no token weighting).
 */
contract VeildGovernance is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum ProposalState { Active, Passed, Defeated, Cancelled, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        string  title;
        string  description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalState state;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant MAX_TITLE_LEN      = 128;
    uint256 public constant MAX_DESC_LEN       = 1024;

    uint256 public quorumVotes   = 10;
    uint256 public votingPeriod  = 7 days;
    uint256 public proposalCount;

    mapping(uint256 => Proposal)                         public proposals;
    mapping(uint256 => mapping(address => bool))         public hasVoted;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalFinalized(uint256 indexed id, ProposalState state);
    event ProposalCancelled(uint256 indexed id);
    event ProposalExecuted(uint256 indexed id);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error TitleTooLong();
    error DescriptionTooLong();
    error VotingPeriodOutOfRange();
    error ProposalNotActive();
    error VotingWindowClosed();
    error VotingWindowOpen();
    error AlreadyVoted();
    error NotProposer();
    error AlreadyFinalized();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Proposal lifecycle ───────────────────────────────────────────────────

    /**
     * @notice Submit a new governance proposal.
     * @param title       Short title (max 128 chars).
     * @param description Full description (max 1 024 chars).
     */
    function createProposal(
        string calldata title,
        string calldata description
    ) external whenNotPaused returns (uint256 proposalId) {
        if (bytes(title).length > MAX_TITLE_LEN)       revert TitleTooLong();
        if (bytes(description).length > MAX_DESC_LEN)  revert DescriptionTooLong();

        proposalId = ++proposalCount;
        uint256 endTime = block.timestamp + votingPeriod;

        proposals[proposalId] = Proposal({
            id:           proposalId,
            proposer:     msg.sender,
            title:        title,
            description:  description,
            forVotes:     0,
            againstVotes: 0,
            startTime:    block.timestamp,
            endTime:      endTime,
            state:        ProposalState.Active
        });

        emit ProposalCreated(proposalId, msg.sender, title, endTime);
    }

    /**
     * @notice Cast a vote on an active proposal.
     * @param proposalId Target proposal ID.
     * @param support    true = FOR, false = AGAINST.
     */
    function castVote(uint256 proposalId, bool support) external whenNotPaused {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Active) revert ProposalNotActive();
        if (block.timestamp > p.endTime)     revert VotingWindowClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.forVotes++;
        } else {
            p.againstVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    /**
     * @notice Finalize a proposal after its voting window has closed.
     *         Anyone may call this once the window closes.
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Active)  revert AlreadyFinalized();
        if (block.timestamp <= p.endTime)     revert VotingWindowOpen();

        uint256 total = p.forVotes + p.againstVotes;
        ProposalState outcome;

        if (total >= quorumVotes && p.forVotes > p.againstVotes) {
            outcome = ProposalState.Passed;
        } else {
            outcome = ProposalState.Defeated;
        }

        p.state = outcome;
        emit ProposalFinalized(proposalId, outcome);
    }

    /**
     * @notice Proposer may cancel their own Active proposal before voting ends.
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.proposer != msg.sender) revert NotProposer();
        if (p.state != ProposalState.Active) revert AlreadyFinalized();

        p.state = ProposalState.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    /**
     * @notice Owner marks a Passed proposal as executed after off-chain action.
     */
    function markExecuted(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Passed) revert ProposalNotActive();

        p.state = ProposalState.Executed;
        emit ProposalExecuted(proposalId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        return proposals[proposalId].state;
    }

    function getVoteTotals(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes) {
        Proposal storage p = proposals[proposalId];
        return (p.forVotes, p.againstVotes);
    }

    // ─── Owner config ─────────────────────────────────────────────────────────

    function setQuorumVotes(uint256 newQuorum) external onlyOwner {
        emit QuorumUpdated(quorumVotes, newQuorum);
        quorumVotes = newQuorum;
    }

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD)
            revert VotingPeriodOutOfRange();
        emit VotingPeriodUpdated(votingPeriod, newPeriod);
        votingPeriod = newPeriod;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
