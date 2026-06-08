// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildPools
 * @notice Crowdfunded question pools for Veild creators.
 *
 * Any fan can open a "question pool" targeting a registered creator by
 * posting a question and staking a minimum CELO amount. Other fans can
 * add to the pot. When the creator answers before the deadline, they
 * collect the full pot minus a platform fee. If the pool expires
 * unanswered, contributors can individually claim refunds.
 *
 * Pool lifecycle:  Active → Answered (creator earns)
 *                          └→ Expired  (fans refunded)
 *                          └→ Cancelled (owner emergency; fans refunded)
 */
contract VeildPools is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum PoolStatus { Active, Answered, Expired, Cancelled }

    struct Pool {
        uint256    id;
        address    creator;       // target creator
        string     question;
        uint256    totalFunded;   // accumulated CELO (wei)
        uint256    deadline;      // unix timestamp
        PoolStatus status;
        string     answer;        // filled when creator answers
        uint256    answeredAt;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        bool    refunded;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant MIN_POOL_AMOUNT  = 0.001 ether;
    uint256 public constant MIN_CONTRIBUTION = 0.0005 ether;
    uint256 public constant MAX_QUESTION_LEN = 280;
    uint256 public constant MAX_ANSWER_LEN   = 1000;
    uint256 public constant MIN_DEADLINE     = 1 days;
    uint256 public constant MAX_DEADLINE     = 30 days;
    uint256 public constant MAX_PLATFORM_BPS = 1000; // 10 %

    // ─── State ────────────────────────────────────────────────────────────────

    VeildRegistry public immutable registry;

    uint256 public platformFeeBps = 500; // 5 %

    uint256 private _poolCounter;

    Pool[]  private _pools;

    // poolId => list of contributions
    mapping(uint256 => Contribution[]) private _contributions;
    // poolId => contributor => cumulative amount (for O(1) lookup)
    mapping(uint256 => mapping(address => uint256)) public contributed;

    uint256 public platformFeesAccrued;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        address indexed starter,
        string  question,
        uint256 initialAmount,
        uint256 deadline
    );

    event PoolContribution(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount,
        uint256 newTotal
    );

    event PoolAnswered(
        uint256 indexed poolId,
        address indexed creator,
        uint256 payout,
        uint256 timestamp
    );

    event PoolExpired(uint256 indexed poolId, uint256 timestamp);
    event PoolCancelled(uint256 indexed poolId);
    event RefundClaimed(uint256 indexed poolId, address indexed contributor, uint256 amount);
    event PlatformFeeUpdated(uint256 oldBps, uint256 newBps);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error CreatorNotRegistered();
    error PoolNotFound();
    error PoolNotActive();
    error PoolDeadlinePassed();
    error PoolNotFinished();
    error TooSmall();
    error InvalidQuestion();
    error InvalidAnswer();
    error DeadlineOutOfRange();
    error AlreadyRefunded();
    error NoContribution();
    error TransferFailed();
    error FeeTooHigh();
    error NotCreator();
    error NoEarnings();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier registeredCreator(address _creator) {
        if (!registry.isRegistered(_creator)) revert CreatorNotRegistered();
        _;
    }

    modifier poolExists(uint256 _poolId) {
        if (_poolId >= _pools.length) revert PoolNotFound();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── External: Pool creation & funding ───────────────────────────────────

    /**
     * @notice Open a new question pool targeting a registered creator.
     * @param _creator  Address of the creator.
     * @param _question The question being funded (max 280 chars).
     * @param _duration Pool duration in seconds (1–30 days).
     */
    function createPool(
        address _creator,
        string calldata _question,
        uint256 _duration
    ) external payable whenNotPaused nonReentrant registeredCreator(_creator) {
        if (msg.value < MIN_POOL_AMOUNT) revert TooSmall();
        uint256 qLen = bytes(_question).length;
        if (qLen == 0 || qLen > MAX_QUESTION_LEN) revert InvalidQuestion();
        if (_duration < MIN_DEADLINE || _duration > MAX_DEADLINE) revert DeadlineOutOfRange();

        uint256 poolId   = _poolCounter++;
        uint256 deadline = block.timestamp + _duration;

        _pools.push(Pool({
            id:          poolId,
            creator:     _creator,
            question:    _question,
            totalFunded: msg.value,
            deadline:    deadline,
            status:      PoolStatus.Active,
            answer:      "",
            answeredAt:  0
        }));

        _contributions[poolId].push(Contribution({
            contributor: msg.sender,
            amount:      msg.value,
            refunded:    false
        }));
        contributed[poolId][msg.sender] += msg.value;

        emit PoolCreated(poolId, _creator, msg.sender, _question, msg.value, deadline);
    }

    /**
     * @notice Contribute additional CELO to an existing active pool.
     * @param _poolId Pool to fund.
     */
    function contribute(uint256 _poolId)
        external payable
        whenNotPaused
        nonReentrant
        poolExists(_poolId)
    {
        Pool storage p = _pools[_poolId];
        if (p.status != PoolStatus.Active) revert PoolNotActive();
        if (block.timestamp >= p.deadline) revert PoolDeadlinePassed();
        if (msg.value < MIN_CONTRIBUTION)  revert TooSmall();

        p.totalFunded += msg.value;
        _contributions[_poolId].push(Contribution({
            contributor: msg.sender,
            amount:      msg.value,
            refunded:    false
        }));
        contributed[_poolId][msg.sender] += msg.value;

        emit PoolContribution(_poolId, msg.sender, msg.value, p.totalFunded);
    }

    // ─── External: Creator actions ────────────────────────────────────────────

    /**
     * @notice Answer a pool question and collect the payout.
     * @param _poolId Pool being answered.
     * @param _answer The creator's answer (max 1000 chars).
     */
    function answerPool(uint256 _poolId, string calldata _answer)
        external
        nonReentrant
        poolExists(_poolId)
    {
        Pool storage p = _pools[_poolId];
        if (p.creator != msg.sender)      revert NotCreator();
        if (p.status != PoolStatus.Active) revert PoolNotActive();
        if (block.timestamp >= p.deadline) revert PoolDeadlinePassed();
        uint256 aLen = bytes(_answer).length;
        if (aLen == 0 || aLen > MAX_ANSWER_LEN) revert InvalidAnswer();

        p.status     = PoolStatus.Answered;
        p.answer     = _answer;
        p.answeredAt = block.timestamp;

        uint256 totalPot    = p.totalFunded;
        uint256 platformCut = (totalPot * platformFeeBps) / 10_000;
        uint256 creatorCut  = totalPot - platformCut;

        platformFeesAccrued += platformCut;

        emit PoolAnswered(_poolId, msg.sender, creatorCut, block.timestamp);

        (bool ok,) = payable(msg.sender).call{value: creatorCut}("");
        if (!ok) revert TransferFailed();
    }

    // ─── External: Anyone can call after deadline ─────────────────────────────

    /**
     * @notice Mark an active pool as Expired (callable by anyone after deadline).
     * @dev Required before contributors can claim refunds.
     */
    function markExpired(uint256 _poolId) external poolExists(_poolId) {
        Pool storage p = _pools[_poolId];
        if (p.status != PoolStatus.Active)   revert PoolNotActive();
        if (block.timestamp < p.deadline)    revert PoolNotFinished();

        p.status = PoolStatus.Expired;
        emit PoolExpired(_poolId, block.timestamp);
    }

    /**
     * @notice Claim a refund for one contribution to an expired or cancelled pool.
     * @param _poolId       Pool that expired or was cancelled.
     * @param _contribIndex Index of the caller's contribution in the pool's array.
     */
    function claimRefund(uint256 _poolId, uint256 _contribIndex)
        external
        nonReentrant
        poolExists(_poolId)
    {
        Pool storage p = _pools[_poolId];
        if (p.status != PoolStatus.Expired && p.status != PoolStatus.Cancelled)
            revert PoolNotFinished();

        Contribution[] storage contribs = _contributions[_poolId];
        if (_contribIndex >= contribs.length) revert NoContribution();

        Contribution storage c = contribs[_contribIndex];
        if (c.contributor != msg.sender) revert NoContribution();
        if (c.refunded) revert AlreadyRefunded();

        c.refunded = true;
        uint256 amount = c.amount;

        emit RefundClaimed(_poolId, msg.sender, amount);

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Emergency cancel an active pool (owner only).
     *         Contributors can then claim refunds.
     */
    function cancelPool(uint256 _poolId) external onlyOwner poolExists(_poolId) {
        Pool storage p = _pools[_poolId];
        if (p.status != PoolStatus.Active) revert PoolNotActive();
        p.status = PoolStatus.Cancelled;
        emit PoolCancelled(_poolId);
    }

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

    function getPool(uint256 _poolId)
        external view
        poolExists(_poolId)
        returns (Pool memory)
    {
        return _pools[_poolId];
    }

    function getPoolCount() external view returns (uint256) {
        return _pools.length;
    }

    function getContributions(uint256 _poolId)
        external view
        poolExists(_poolId)
        returns (Contribution[] memory)
    {
        return _contributions[_poolId];
    }

    /**
     * @notice Returns all active pools for a given creator.
     */
    function getActivePools(address _creator) external view returns (Pool[] memory) {
        uint256 total = _pools.length;
        uint256 count;
        for (uint256 i; i < total; i++) {
            if (_pools[i].creator == _creator && _pools[i].status == PoolStatus.Active) {
                count++;
            }
        }
        Pool[] memory result = new Pool[](count);
        uint256 j;
        for (uint256 i; i < total; i++) {
            if (_pools[i].creator == _creator && _pools[i].status == PoolStatus.Active) {
                result[j++] = _pools[i];
            }
        }
        return result;
    }

    /**
     * @notice Returns paginated pools (all statuses) for a creator.
     */
    function getPoolsByCreator(address _creator, uint256 _offset, uint256 _limit)
        external view
        returns (Pool[] memory)
    {
        uint256 total = _pools.length;
        uint256 count;
        for (uint256 i; i < total; i++) {
            if (_pools[i].creator == _creator) count++;
        }
        if (_offset >= count) return new Pool[](0);
        uint256 end = _offset + _limit > count ? count : _offset + _limit;
        Pool[] memory result = new Pool[](end - _offset);
        uint256 j;
        uint256 idx;
        for (uint256 i; i < total; i++) {
            if (_pools[i].creator == _creator) {
                if (idx >= _offset && idx < end) {
                    result[j++] = _pools[i];
                }
                idx++;
            }
        }
        return result;
    }
}
