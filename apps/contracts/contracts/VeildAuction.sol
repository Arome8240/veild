// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildAuction
 * @notice Timed CELO auction for exclusive creator Q&A slots.
 *
 * Flow
 * ────
 * 1. Creator opens an auction with a minimum bid, a label, and a duration.
 * 2. Fans place bids. Each new bid must exceed the current highest bid by at
 *    least MIN_BID_INCREMENT_BPS (default 5 %).
 * 3. Outbid fans are automatically refunded.
 * 4. After the deadline the creator calls claimWin() to receive the winning
 *    amount minus the platform fee. The winning fan gets to submit their
 *    question via VeildMessages directly.
 * 5. The creator may cancel an auction that has no bids.
 */
contract VeildAuction is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum AuctionState { Active, Ended, Cancelled }

    struct Auction {
        uint256       id;
        address       creator;
        string        label;
        uint256       minBid;
        uint256       highestBid;
        address       highestBidder;
        uint256       startTime;
        uint256       endTime;
        AuctionState  state;
        bool          claimed;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant MIN_DURATION          = 1 hours;
    uint256 public constant MAX_DURATION          = 30 days;
    uint256 public constant MAX_LABEL_LEN         = 120;
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;   // 5 %
    uint256 public constant PLATFORM_FEE_BPS      = 300;   // 3 %
    uint256 public constant BPS_BASE              = 10_000;

    VeildRegistry public immutable registry;

    uint256  public auctionCount;
    address  public feeRecipient;

    mapping(uint256 => Auction) public auctions;

    // ─── Events ───────────────────────────────────────────────────────────────

    event AuctionCreated(uint256 indexed id, address indexed creator, uint256 endTime, uint256 minBid);
    event BidPlaced(uint256 indexed id, address indexed bidder, uint256 amount);
    event BidRefunded(uint256 indexed id, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed id, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed id);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotRegistered();
    error LabelTooLong();
    error DurationOutOfRange();
    error BidTooLow();
    error AuctionNotActive();
    error AuctionNotEnded();
    error AlreadyClaimed();
    error HasBids();
    error NotCreator();
    error ZeroMinBid();
    error TransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry     = VeildRegistry(_registry);
        feeRecipient = msg.sender;
    }

    // ─── Creator ──────────────────────────────────────────────────────────────

    /**
     * @notice Open a new timed auction slot.
     * @param label    Short description of what is being auctioned (max 120 chars).
     * @param minBid   Minimum opening bid in wei. Must be > 0.
     * @param duration Auction window in seconds (1 hour – 30 days).
     */
    function createAuction(
        string calldata label,
        uint256         minBid,
        uint256         duration
    ) external whenNotPaused returns (uint256 auctionId) {
        if (!registry.isRegistered(msg.sender))              revert NotRegistered();
        if (bytes(label).length > MAX_LABEL_LEN)             revert LabelTooLong();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert DurationOutOfRange();
        if (minBid == 0)                                     revert ZeroMinBid();

        auctionId = ++auctionCount;
        uint256 endTime = block.timestamp + duration;

        auctions[auctionId] = Auction({
            id:            auctionId,
            creator:       msg.sender,
            label:         label,
            minBid:        minBid,
            highestBid:    0,
            highestBidder: address(0),
            startTime:     block.timestamp,
            endTime:       endTime,
            state:         AuctionState.Active,
            claimed:       false
        });

        emit AuctionCreated(auctionId, msg.sender, endTime, minBid);
    }

    /**
     * @notice Claim winning proceeds after auction ends. Creator only.
     */
    function claimWin(uint256 auctionId) external nonReentrant {
        Auction storage a = auctions[auctionId];
        if (a.creator != msg.sender)              revert NotCreator();
        if (a.state == AuctionState.Cancelled)    revert AuctionNotActive();
        if (block.timestamp <= a.endTime)         revert AuctionNotEnded();
        if (a.claimed)                            revert AlreadyClaimed();

        a.state   = AuctionState.Ended;
        a.claimed = true;

        uint256 fee    = (a.highestBid * PLATFORM_FEE_BPS) / BPS_BASE;
        uint256 payout = a.highestBid - fee;

        if (fee > 0) {
            (bool fok,) = feeRecipient.call{value: fee}("");
            if (!fok) revert TransferFailed();
        }

        if (payout > 0) {
            (bool ok,) = a.creator.call{value: payout}("");
            if (!ok) revert TransferFailed();
        }

        emit AuctionEnded(auctionId, a.highestBidder, a.highestBid);
    }

    /**
     * @notice Creator may cancel an auction that has no bids.
     */
    function cancelAuction(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        if (a.creator != msg.sender)           revert NotCreator();
        if (a.state != AuctionState.Active)    revert AuctionNotActive();
        if (a.highestBidder != address(0))     revert HasBids();

        a.state = AuctionState.Cancelled;
        emit AuctionCancelled(auctionId);
    }

    // ─── Fan ──────────────────────────────────────────────────────────────────

    /**
     * @notice Place a bid on an active auction. Must exceed current highest bid
     *         by at least MIN_BID_INCREMENT_BPS (5 %).
     */
    function placeBid(uint256 auctionId) external payable nonReentrant whenNotPaused {
        Auction storage a = auctions[auctionId];
        if (a.state != AuctionState.Active) revert AuctionNotActive();
        if (block.timestamp > a.endTime)    revert AuctionNotActive();

        uint256 minRequired = a.highestBid == 0
            ? a.minBid
            : a.highestBid + (a.highestBid * MIN_BID_INCREMENT_BPS) / BPS_BASE;

        if (msg.value < minRequired) revert BidTooLow();

        // Refund previous highest bidder
        address prevBidder = a.highestBidder;
        uint256 prevBid    = a.highestBid;

        a.highestBid    = msg.value;
        a.highestBidder = msg.sender;

        if (prevBidder != address(0)) {
            (bool ok,) = prevBidder.call{value: prevBid}("");
            if (!ok) revert TransferFailed();
            emit BidRefunded(auctionId, prevBidder, prevBid);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    function isActive(uint256 auctionId) external view returns (bool) {
        Auction storage a = auctions[auctionId];
        return a.state == AuctionState.Active && block.timestamp <= a.endTime;
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
