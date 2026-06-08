// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildSubscriptions
 * @notice Monthly fan subscriptions for Veild creators.
 *
 * Creators define up to MAX_TIERS subscription tiers (each with a price and label).
 * Fans pay the tier price for a 30-day subscription; renewing before expiry extends
 * the existing subscription rather than restarting it. Platform takes a fee on each
 * payment; creators claim accumulated revenue with claimEarnings().
 */
contract VeildSubscriptions is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Tier {
        uint256 pricePerMonth; // wei per 30 days
        string  label;         // e.g. "Fan", "Super Fan", "VIP"
        bool    isActive;
    }

    struct Subscription {
        uint256 tierId;
        uint256 startedAt;
        uint256 expiresAt;  // unix timestamp; 0 = never subscribed
        uint256 renewals;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant SUBSCRIPTION_PERIOD = 30 days;
    uint256 public constant MAX_PLATFORM_BPS    = 1000; // 10 %
    uint256 public constant MAX_TIERS           = 3;
    uint256 public constant MAX_LABEL_LEN       = 32;

    // ─── State ────────────────────────────────────────────────────────────────

    VeildRegistry public immutable registry;

    uint256 public platformFeeBps = 500; // 5 %

    // creator => their subscription tiers
    mapping(address => Tier[]) private _tiers;
    // creator => fan => Subscription
    mapping(address => mapping(address => Subscription)) private _subscriptions;
    // creator => claimable revenue (wei)
    mapping(address => uint256) private _earnings;
    // creator => live subscriber count (only increments on first subscription)
    mapping(address => uint256) public subscriberCount;

    uint256 public platformFeesAccrued;

    // ─── Events ───────────────────────────────────────────────────────────────

    event TierCreated(
        address indexed creator,
        uint256 tierId,
        uint256 pricePerMonth,
        string  label
    );

    event TierUpdated(address indexed creator, uint256 tierId, uint256 newPrice);
    event TierDeactivated(address indexed creator, uint256 tierId);

    event Subscribed(
        address indexed creator,
        address indexed fan,
        uint256 tierId,
        uint256 expiresAt
    );

    event Renewed(
        address indexed creator,
        address indexed fan,
        uint256 newExpiresAt
    );

    event EarningsClaimed(address indexed creator, uint256 amount);
    event PlatformFeeUpdated(uint256 oldBps, uint256 newBps);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error CreatorNotRegistered();
    error TierNotFound();
    error TierInactive();
    error InsufficientPayment();
    error MaxTiersReached();
    error LabelTooLong();
    error NoEarnings();
    error TransferFailed();
    error FeeTooHigh();
    error CannotSubscribeToSelf();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRegisteredCreator() {
        if (!registry.isRegistered(msg.sender)) revert CreatorNotRegistered();
        _;
    }

    modifier registeredCreator(address _creator) {
        if (!registry.isRegistered(_creator)) revert CreatorNotRegistered();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── External: Creator actions ────────────────────────────────────────────

    /**
     * @notice Create a new subscription tier (max MAX_TIERS per creator).
     * @param _pricePerMonth Price in wei for 30 days of access.
     * @param _label         Short label shown to fans (max 32 chars).
     */
    function createTier(uint256 _pricePerMonth, string calldata _label)
        external
        whenNotPaused
        onlyRegisteredCreator
    {
        if (bytes(_label).length > MAX_LABEL_LEN) revert LabelTooLong();
        Tier[] storage tiers = _tiers[msg.sender];
        if (tiers.length >= MAX_TIERS) revert MaxTiersReached();

        uint256 tierId = tiers.length;
        tiers.push(Tier({
            pricePerMonth: _pricePerMonth,
            label:         _label,
            isActive:      true
        }));

        emit TierCreated(msg.sender, tierId, _pricePerMonth, _label);
    }

    /**
     * @notice Update the price of an existing tier.
     */
    function updateTierPrice(uint256 _tierId, uint256 _newPrice) external onlyRegisteredCreator {
        Tier[] storage tiers = _tiers[msg.sender];
        if (_tierId >= tiers.length) revert TierNotFound();
        tiers[_tierId].pricePerMonth = _newPrice;
        emit TierUpdated(msg.sender, _tierId, _newPrice);
    }

    /**
     * @notice Deactivate a tier. Existing active subscriptions remain valid.
     */
    function deactivateTier(uint256 _tierId) external onlyRegisteredCreator {
        Tier[] storage tiers = _tiers[msg.sender];
        if (_tierId >= tiers.length) revert TierNotFound();
        tiers[_tierId].isActive = false;
        emit TierDeactivated(msg.sender, _tierId);
    }

    /**
     * @notice Claim all accumulated subscription revenue.
     */
    function claimEarnings() external nonReentrant {
        uint256 amount = _earnings[msg.sender];
        if (amount == 0) revert NoEarnings();

        _earnings[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EarningsClaimed(msg.sender, amount);
    }

    // ─── External: Fan actions ────────────────────────────────────────────────

    /**
     * @notice Subscribe (or renew) to a creator's tier.
     *
     * First subscription: starts a new 30-day window.
     * Renewal of active sub: extends expiry by SUBSCRIPTION_PERIOD.
     * Renewal of expired sub: starts fresh.
     *
     * @param _creator Target creator address.
     * @param _tierId  Index of the tier to subscribe to.
     */
    function subscribe(address _creator, uint256 _tierId)
        external payable
        whenNotPaused
        nonReentrant
        registeredCreator(_creator)
    {
        if (msg.sender == _creator) revert CannotSubscribeToSelf();

        Tier[] storage tiers = _tiers[_creator];
        if (_tierId >= tiers.length)    revert TierNotFound();
        Tier storage t = tiers[_tierId];
        if (!t.isActive)                revert TierInactive();
        if (msg.value < t.pricePerMonth) revert InsufficientPayment();

        uint256 platformCut = (msg.value * platformFeeBps) / 10_000;
        uint256 creatorCut  = msg.value - platformCut;

        _earnings[_creator]  += creatorCut;
        platformFeesAccrued  += platformCut;

        Subscription storage sub = _subscriptions[_creator][msg.sender];
        bool isNew = sub.expiresAt == 0 || block.timestamp > sub.expiresAt;

        if (isNew) {
            sub.tierId    = _tierId;
            sub.startedAt = block.timestamp;
            sub.renewals  = 0;
            sub.expiresAt = block.timestamp + SUBSCRIPTION_PERIOD;
            subscriberCount[_creator]++;
            emit Subscribed(_creator, msg.sender, _tierId, sub.expiresAt);
        } else {
            sub.renewals++;
            sub.expiresAt += SUBSCRIPTION_PERIOD;
            emit Renewed(_creator, msg.sender, sub.expiresAt);
        }
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

    /**
     * @notice Returns true if the fan currently has an active subscription.
     */
    function isSubscribed(address _creator, address _fan) external view returns (bool) {
        return _subscriptions[_creator][_fan].expiresAt > block.timestamp;
    }

    function getSubscription(address _creator, address _fan)
        external view
        returns (Subscription memory)
    {
        return _subscriptions[_creator][_fan];
    }

    function getTiers(address _creator) external view returns (Tier[] memory) {
        return _tiers[_creator];
    }

    function getTierCount(address _creator) external view returns (uint256) {
        return _tiers[_creator].length;
    }

    function getEarnings(address _creator) external view returns (uint256) {
        return _earnings[_creator];
    }
}
