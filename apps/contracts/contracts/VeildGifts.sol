// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildGifts
 * @notice Fans send virtual CELO gifts (predefined denominations) to creators.
 *
 * Each "gift type" has a name (emoji-friendly) and a fixed CELO price defined
 * by the owner. Fans send the exact price as msg.value. Platform takes a fee;
 * creators claim the rest via claimEarnings().
 */
contract VeildGifts is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct GiftType {
        string  name;
        uint256 price;  // in wei
        bool    active;
    }

    struct GiftRecord {
        address sender;
        uint256 giftTypeId;
        uint256 amount;
        uint256 sentAt;
        string  message;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant PLATFORM_FEE_BPS = 500;  // 5 %
    uint256 public constant BPS_BASE         = 10_000;
    uint256 public constant MAX_MESSAGE_LEN  = 140;
    uint256 public constant MAX_GIFTS_STORED = 50;   // per creator (ring buffer)

    VeildRegistry public immutable registry;
    address        public feeRecipient;

    uint256 public giftTypeCount;
    mapping(uint256 => GiftType)     public giftTypes;
    mapping(address => uint256)      public earnings;
    mapping(address => GiftRecord[]) private _gifts;

    // ─── Events ───────────────────────────────────────────────────────────────

    event GiftTypeAdded(uint256 indexed id, string name, uint256 price);
    event GiftTypeUpdated(uint256 indexed id, uint256 newPrice, bool active);
    event GiftSent(address indexed creator, address indexed sender, uint256 indexed giftTypeId, uint256 amount);
    event EarningsClaimed(address indexed creator, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotRegistered();
    error InvalidGiftType();
    error IncorrectValue();
    error MessageTooLong();
    error NoEarnings();
    error TransferFailed();
    error ZeroPrice();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry     = VeildRegistry(_registry);
        feeRecipient = msg.sender;

        // Seed default gift types
        _addGiftType("Rose",        0.001 ether);
        _addGiftType("Rocket",      0.005 ether);
        _addGiftType("Crown",       0.01  ether);
        _addGiftType("Diamond",     0.05  ether);
        _addGiftType("Megaphone",   0.1   ether);
    }

    // ─── Fan ──────────────────────────────────────────────────────────────────

    /**
     * @notice Send a gift to a creator. msg.value must equal the gift type price.
     */
    function sendGift(
        address         creator,
        uint256         giftTypeId,
        string calldata message
    ) external payable nonReentrant whenNotPaused {
        if (!registry.isRegistered(creator))               revert NotRegistered();
        if (giftTypeId == 0 || giftTypeId > giftTypeCount) revert InvalidGiftType();

        GiftType storage gt = giftTypes[giftTypeId];
        if (!gt.active)              revert InvalidGiftType();
        if (msg.value != gt.price)   revert IncorrectValue();
        if (bytes(message).length > MAX_MESSAGE_LEN) revert MessageTooLong();

        uint256 fee    = (msg.value * PLATFORM_FEE_BPS) / BPS_BASE;
        uint256 payout = msg.value - fee;

        earnings[creator] += payout;

        if (fee > 0) {
            (bool fok,) = feeRecipient.call{value: fee}("");
            if (!fok) revert TransferFailed();
        }

        GiftRecord[] storage gifts = _gifts[creator];
        if (gifts.length >= MAX_GIFTS_STORED) {
            // Shift left to make room
            for (uint256 i = 0; i < gifts.length - 1; i++) {
                gifts[i] = gifts[i + 1];
            }
            gifts.pop();
        }
        gifts.push(GiftRecord({
            sender:     msg.sender,
            giftTypeId: giftTypeId,
            amount:     msg.value,
            sentAt:     block.timestamp,
            message:    message
        }));

        emit GiftSent(creator, msg.sender, giftTypeId, msg.value);
    }

    /**
     * @notice Creator claims accumulated gift earnings.
     */
    function claimEarnings() external nonReentrant whenNotPaused {
        uint256 amount = earnings[msg.sender];
        if (amount == 0) revert NoEarnings();
        earnings[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit EarningsClaimed(msg.sender, amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getGifts(address creator) external view returns (GiftRecord[] memory) {
        return _gifts[creator];
    }

    function getGiftType(uint256 id) external view returns (GiftType memory) {
        return giftTypes[id];
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    function addGiftType(string calldata name, uint256 price) external onlyOwner {
        if (price == 0) revert ZeroPrice();
        _addGiftType(name, price);
    }

    function updateGiftType(uint256 id, uint256 newPrice, bool active) external onlyOwner {
        if (id == 0 || id > giftTypeCount) revert InvalidGiftType();
        if (newPrice == 0) revert ZeroPrice();
        giftTypes[id].price  = newPrice;
        giftTypes[id].active = active;
        emit GiftTypeUpdated(id, newPrice, active);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _addGiftType(string memory name, uint256 price) internal {
        giftTypeCount++;
        giftTypes[giftTypeCount] = GiftType({ name: name, price: price, active: true });
        emit GiftTypeAdded(giftTypeCount, name, price);
    }
}
