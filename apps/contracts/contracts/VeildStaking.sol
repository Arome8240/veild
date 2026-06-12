// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildStaking
 * @notice Creators stake CELO to boost their visibility on the Veild platform.
 *
 * Boost model
 * ───────────
 * • Creators deposit any amount of CELO into this contract.
 * • A creator's "boost score" = total staked CELO (read by the frontend for ranking).
 * • Staked CELO can be withdrawn after a COOLDOWN_PERIOD (7 days by default).
 *   An active withdrawal request prevents double-withdrawal.
 * • Platform earns no fee on staking; staking is purely for discoverability.
 */
contract VeildStaking is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct StakeInfo {
        uint256 amount;
        uint256 withdrawRequestedAt;
        bool    withdrawPending;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant COOLDOWN_PERIOD = 7 days;

    VeildRegistry public immutable registry;

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Staked(address indexed creator, uint256 amount);
    event WithdrawRequested(address indexed creator, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotRegistered();
    error ZeroAmount();
    error NothingStaked();
    error WithdrawAlreadyPending();
    error NoWithdrawPending();
    error CooldownNotMet();
    error TransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── Creator ──────────────────────────────────────────────────────────────

    /**
     * @notice Stake CELO to boost discoverability.
     */
    function stake() external payable nonReentrant whenNotPaused {
        if (!registry.isRegistered(msg.sender)) revert NotRegistered();
        if (msg.value == 0)                     revert ZeroAmount();

        StakeInfo storage s = stakes[msg.sender];
        s.amount += msg.value;
        totalStaked += msg.value;

        // Reset any pending withdrawal on new stake
        if (s.withdrawPending) {
            s.withdrawPending        = false;
            s.withdrawRequestedAt    = 0;
        }

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Initiate withdrawal. Starts the cooldown timer.
     */
    function requestWithdraw() external whenNotPaused {
        StakeInfo storage s = stakes[msg.sender];
        if (s.amount == 0)         revert NothingStaked();
        if (s.withdrawPending)     revert WithdrawAlreadyPending();

        s.withdrawPending     = true;
        s.withdrawRequestedAt = block.timestamp;

        emit WithdrawRequested(msg.sender, s.amount);
    }

    /**
     * @notice Complete withdrawal after cooldown period has elapsed.
     */
    function withdraw() external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        if (!s.withdrawPending)                                   revert NoWithdrawPending();
        if (block.timestamp < s.withdrawRequestedAt + COOLDOWN_PERIOD) revert CooldownNotMet();

        uint256 amount   = s.amount;
        s.amount         = 0;
        s.withdrawPending = false;
        totalStaked      -= amount;

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getStake(address creator) external view returns (StakeInfo memory) {
        return stakes[creator];
    }

    function boostScore(address creator) external view returns (uint256) {
        return stakes[creator].amount;
    }

    function canWithdraw(address creator) external view returns (bool) {
        StakeInfo storage s = stakes[creator];
        return s.withdrawPending &&
               block.timestamp >= s.withdrawRequestedAt + COOLDOWN_PERIOD;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
