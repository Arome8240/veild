// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildTips
 * @notice Direct fan-to-creator CELO tipping with public leaderboards.
 *
 * Unlike anonymous messages, tips are attributed to the sender — they are
 * a voluntary public act of support. Each creator gets a live leaderboard
 * of their top fans (by cumulative tips). Platform takes a small fee;
 * the creator claims the rest via claimEarnings().
 */
contract VeildTips is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Tip {
        address fan;
        uint256 amount;     // wei
        string  message;    // optional public note (max MAX_MSG_LEN bytes)
        uint256 sentAt;
    }

    struct FanEntry {
        address fan;
        uint256 totalTipped; // cumulative wei tipped to this creator
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant MAX_MSG_LEN      = 140;
    uint256 public constant MAX_PLATFORM_BPS = 1000; // 10 %
    uint256 public constant LEADERBOARD_SIZE = 10;
    uint256 public constant MIN_TIP          = 0.001 ether; // ~$0.001

    // ─── State ────────────────────────────────────────────────────────────────

    VeildRegistry public immutable registry;

    uint256 public platformFeeBps = 300; // 3 %

    // creator => claimable earnings (wei)
    mapping(address => uint256) private _earnings;
    // creator => all tips received (chronological)
    mapping(address => Tip[])   private _tips;
    // creator => fan => cumulative amount tipped (for leaderboard)
    mapping(address => mapping(address => uint256)) public fanTotals;
    // creator => sorted top-N fan entries
    mapping(address => FanEntry[]) private _leaderboard;

    uint256 public platformFeesAccrued;

    // ─── Events ───────────────────────────────────────────────────────────────

    event TipSent(
        address indexed creator,
        address indexed fan,
        uint256 amount,
        string  message,
        uint256 timestamp
    );

    event EarningsClaimed(address indexed creator, uint256 amount, uint256 timestamp);
    event PlatformFeeUpdated(uint256 oldBps, uint256 newBps);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error CreatorNotRegistered();
    error TipTooSmall();
    error MessageTooLong();
    error NoEarnings();
    error TransferFailed();
    error FeeTooHigh();
    error CannotTipSelf();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier registeredCreator(address _creator) {
        if (!registry.isRegistered(_creator)) revert CreatorNotRegistered();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── External: Fan actions ────────────────────────────────────────────────

    /**
     * @notice Send a CELO tip to a registered creator.
     * @param _creator The creator's address.
     * @param _message Optional public message (max 140 bytes). Pass "" for none.
     */
    function tip(
        address _creator,
        string calldata _message
    ) external payable whenNotPaused nonReentrant registeredCreator(_creator) {
        if (msg.value < MIN_TIP)                      revert TipTooSmall();
        if (msg.sender == _creator)                   revert CannotTipSelf();
        if (bytes(_message).length > MAX_MSG_LEN)     revert MessageTooLong();

        uint256 platformCut = (msg.value * platformFeeBps) / 10_000;
        uint256 creatorCut  = msg.value - platformCut;

        _earnings[_creator]  += creatorCut;
        platformFeesAccrued  += platformCut;

        _tips[_creator].push(Tip({
            fan:     msg.sender,
            amount:  msg.value,
            message: _message,
            sentAt:  block.timestamp
        }));

        _updateLeaderboard(_creator, msg.sender, msg.value);

        emit TipSent(_creator, msg.sender, msg.value, _message, block.timestamp);
    }

    // ─── External: Creator actions ────────────────────────────────────────────

    /**
     * @notice Claim all accumulated tip earnings.
     */
    function claimEarnings() external nonReentrant {
        uint256 amount = _earnings[msg.sender];
        if (amount == 0) revert NoEarnings();

        _earnings[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EarningsClaimed(msg.sender, amount, block.timestamp);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setPlatformFee(uint256 _bps) external onlyOwner {
        if (_bps > MAX_PLATFORM_BPS) revert FeeTooHigh();
        emit PlatformFeeUpdated(platformFeeBps, _bps);
        platformFeeBps = _bps;
    }

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeesAccrued;
        if (amount == 0) revert NoEarnings();
        platformFeesAccrued = 0;
        (bool ok,) = payable(owner()).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause()   external onlyOwner { _pause();   }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getEarnings(address _creator) external view returns (uint256) {
        return _earnings[_creator];
    }

    function getTips(address _creator) external view returns (Tip[] memory) {
        return _tips[_creator];
    }

    function getTipCount(address _creator) external view returns (uint256) {
        return _tips[_creator].length;
    }

    function getLeaderboard(address _creator) external view returns (FanEntry[] memory) {
        return _leaderboard[_creator];
    }

    function getTotalTipped(address _creator) external view returns (uint256 total) {
        Tip[] storage tips_ = _tips[_creator];
        for (uint256 i; i < tips_.length; i++) {
            total += tips_[i].amount;
        }
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _updateLeaderboard(address _creator, address _fan, uint256 _amount) internal {
        fanTotals[_creator][_fan] += _amount;
        uint256 newTotal = fanTotals[_creator][_fan];

        FanEntry[] storage lb  = _leaderboard[_creator];
        uint256            len = lb.length;

        // Update existing entry if already on the board
        for (uint256 i; i < len; i++) {
            if (lb[i].fan == _fan) {
                lb[i].totalTipped = newTotal;
                _bubbleUp(lb, i);
                return;
            }
        }

        // Add new entry
        if (len < LEADERBOARD_SIZE) {
            lb.push(FanEntry({ fan: _fan, totalTipped: newTotal }));
            _bubbleUp(lb, len);
        } else if (newTotal > lb[len - 1].totalTipped) {
            lb[len - 1] = FanEntry({ fan: _fan, totalTipped: newTotal });
            _bubbleUp(lb, len - 1);
        }
    }

    function _bubbleUp(FanEntry[] storage lb, uint256 idx) internal {
        while (idx > 0 && lb[idx].totalTipped > lb[idx - 1].totalTipped) {
            FanEntry memory tmp = lb[idx - 1];
            lb[idx - 1] = lb[idx];
            lb[idx]     = tmp;
            idx--;
        }
    }
}
