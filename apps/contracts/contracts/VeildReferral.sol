// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildReferral
 * @notice On-chain referral tracking for the Veild platform.
 *
 * Flow
 * ────
 * 1. Any registered creator generates a referral code (= their address as bytes).
 * 2. When a new user registers via the frontend they pass the referrer's address.
 * 3. This contract records the referral mapping and credits the referrer.
 * 4. Owner periodically calls distributeRewards() to send CELO rewards from the
 *    contract's balance to top referrers, or referrers call claimReward().
 * 5. Platform can fund the reward pool with receive().
 */
contract VeildReferral is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct ReferrerStats {
        uint256 totalReferrals;
        uint256 pendingReward;
        uint256 claimedReward;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant REWARD_PER_REFERRAL = 0.001 ether; // 0.001 CELO per referral

    VeildRegistry public immutable registry;

    mapping(address => ReferrerStats) public referrerStats;
    mapping(address => address)       public referredBy;
    mapping(address => bool)          public hasBeenReferred;

    uint256 public totalReferrals;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ReferralRecorded(address indexed referrer, address indexed referred);
    event RewardClaimed(address indexed referrer, uint256 amount);
    event RewardPerReferralUpdated(uint256 newReward);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyReferred();
    error SelfReferral();
    error ReferrerNotRegistered();
    error NoRewardPending();
    error InsufficientFunds();
    error TransferFailed();
    error NotRegistered();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * @notice Record that `referred` was brought to Veild by `referrer`.
     *         Can only be called once per address. Called by the platform.
     */
    function recordReferral(address referrer, address referred)
        external
        onlyOwner
        whenNotPaused
    {
        if (referrer == referred)             revert SelfReferral();
        if (hasBeenReferred[referred])        revert AlreadyReferred();
        if (!registry.isRegistered(referrer)) revert ReferrerNotRegistered();

        hasBeenReferred[referred] = true;
        referredBy[referred]      = referrer;

        referrerStats[referrer].totalReferrals++;
        referrerStats[referrer].pendingReward += REWARD_PER_REFERRAL;
        totalReferrals++;

        emit ReferralRecorded(referrer, referred);
    }

    /**
     * @notice Referrer claims their accumulated CELO rewards.
     */
    function claimReward() external nonReentrant whenNotPaused {
        ReferrerStats storage s = referrerStats[msg.sender];
        uint256 reward = s.pendingReward;
        if (reward == 0)                      revert NoRewardPending();
        if (address(this).balance < reward)   revert InsufficientFunds();

        s.pendingReward  = 0;
        s.claimedReward += reward;

        (bool ok,) = msg.sender.call{value: reward}("");
        if (!ok) revert TransferFailed();

        emit RewardClaimed(msg.sender, reward);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getStats(address referrer) external view returns (ReferrerStats memory) {
        return referrerStats[referrer];
    }

    function getReferrer(address referred) external view returns (address) {
        return referredBy[referred];
    }

    // ─── Fund pool ────────────────────────────────────────────────────────────

    receive() external payable {}

    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        if (address(this).balance < amount) revert InsufficientFunds();
        (bool ok,) = owner().call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
