// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VeildBadges
 * @notice Soulbound achievement badges for creators and fans on the Veild platform.
 *         Badges are non-transferable (ERC-5192 style) and awarded by the platform
 *         owner based on on-chain activity milestones.
 *
 * Badge types (badgeId):
 *   0 — First Message   : creator received their first message
 *   1 — Rising Star     : creator crossed 100 messages
 *   2 — Verified Creator: creator was manually verified
 *   3 — First Tip       : creator received their first tip
 *   4 — Top Tipper      : fan tipped more than 1 CELO total to any creator
 *   5 — Subscriber      : fan holds an active subscription to any creator
 *   6 — Pool Creator    : creator opened their first question pool
 *   7 — Pool Answerer   : creator answered a funded pool question
 */
contract VeildBadges is Ownable, Pausable {
    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MAX_BADGE_ID = 7;

    // ── Storage ───────────────────────────────────────────────────────────────
    /// @dev badgeId => holder => owned
    mapping(uint256 => mapping(address => bool)) private _badges;

    /// @dev holder => list of owned badgeIds (for enumeration)
    mapping(address => uint256[]) private _holderBadges;

    // ── Events ────────────────────────────────────────────────────────────────
    event BadgeAwarded(address indexed holder, uint256 indexed badgeId);
    event BadgeRevoked(address indexed holder, uint256 indexed badgeId);

    // ── Errors ────────────────────────────────────────────────────────────────
    error InvalidBadgeId(uint256 badgeId);
    error AlreadyOwned(address holder, uint256 badgeId);
    error NotOwned(address holder, uint256 badgeId);

    constructor() Ownable(msg.sender) {}

    // ── Admin ─────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Award a badge to an address.
     * @param holder  Recipient of the badge.
     * @param badgeId Badge type (0–MAX_BADGE_ID).
     */
    function awardBadge(address holder, uint256 badgeId)
        external
        onlyOwner
        whenNotPaused
    {
        if (badgeId > MAX_BADGE_ID) revert InvalidBadgeId(badgeId);
        if (_badges[badgeId][holder])  revert AlreadyOwned(holder, badgeId);

        _badges[badgeId][holder] = true;
        _holderBadges[holder].push(badgeId);

        emit BadgeAwarded(holder, badgeId);
    }

    /**
     * @notice Award multiple badges to a single address in one call.
     * Skips badge IDs already owned rather than reverting.
     */
    function awardBadges(address holder, uint256[] calldata badgeIds)
        external
        onlyOwner
        whenNotPaused
    {
        for (uint256 i = 0; i < badgeIds.length; i++) {
            uint256 id = badgeIds[i];
            if (id > MAX_BADGE_ID) revert InvalidBadgeId(id);
            if (_badges[id][holder]) continue;

            _badges[id][holder] = true;
            _holderBadges[holder].push(id);

            emit BadgeAwarded(holder, id);
        }
    }

    /**
     * @notice Revoke a badge (e.g. for abuse).
     */
    function revokeBadge(address holder, uint256 badgeId)
        external
        onlyOwner
    {
        if (badgeId > MAX_BADGE_ID) revert InvalidBadgeId(badgeId);
        if (!_badges[badgeId][holder]) revert NotOwned(holder, badgeId);

        _badges[badgeId][holder] = false;

        // Remove from enumeration array
        uint256[] storage arr = _holderBadges[holder];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == badgeId) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }

        emit BadgeRevoked(holder, badgeId);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /// @notice Returns true if `holder` owns badge `badgeId`.
    function hasBadge(address holder, uint256 badgeId) external view returns (bool) {
        if (badgeId > MAX_BADGE_ID) return false;
        return _badges[badgeId][holder];
    }

    /// @notice Returns all badge IDs owned by `holder`.
    function getBadges(address holder) external view returns (uint256[] memory) {
        return _holderBadges[holder];
    }

    /// @notice Returns how many badges `holder` owns.
    function badgeCount(address holder) external view returns (uint256) {
        return _holderBadges[holder].length;
    }

    /// @notice Returns the full 8-slot bool bitmap for a holder.
    function getBadgeBitmap(address holder) external view returns (bool[8] memory bitmap) {
        for (uint256 i = 0; i <= MAX_BADGE_ID; i++) {
            bitmap[i] = _badges[i][holder];
        }
    }
}
