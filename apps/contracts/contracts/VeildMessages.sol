// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VeildRegistry.sol";

/**
 * @title VeildMessages
 * @notice Core protocol contract for the Veild anonymous messaging platform.
 *
 * Privacy model
 * ─────────────
 * • The sender address is NEVER stored in the Message struct.
 *   Only `block.timestamp` and content are stored.
 * • Anyone can inspect the chain and see which address called
 *   sendMessage/sendPriorityMessage, but the contract itself exposes
 *   no mapping from message → sender.
 * • For stronger anonymity, use a relayer or a ZK proof layer on top.
 *
 * Economics
 * ─────────
 * • Priority messages require a fixed CELO payment (priorityFee).
 * • Platform takes platformFeeBps (default 500 = 5 %).
 * • Creator claims the remainder via claimEarnings().
 * • The platform owner can withdraw accumulated platform fees.
 */
contract VeildMessages is Ownable, Pausable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Message {
        uint256 id;
        string  content;        // message text (max MAX_CONTENT_LEN chars)
        string  reply;          // creator reply (empty until answered)
        bool    isPriority;
        uint256 fee;            // wei paid (0 for free messages)
        uint256 sentAt;
        uint256 repliedAt;      // 0 until replied
        bool    isAnswered;
        bool    isPublished;    // true if added to public wall
        bool    isArchived;
    }

    struct WallPost {
        uint256 id;
        uint256 messageId;
        string  question;
        string  answer;
        uint256 likes;
        uint256 publishedAt;
    }

    struct InboxStats {
        uint256 total;
        uint256 unread;
        uint256 priorityCount;
        uint256 publishedCount;
        uint256 pendingEarnings;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant MAX_CONTENT_LEN = 1000; // bytes (≈ chars for ASCII)
    uint256 public constant MAX_PLATFORM_BPS = 1000; // 10 %

    // ─── State ────────────────────────────────────────────────────────────────

    VeildRegistry public immutable registry;

    uint256 public priorityFee    = 0.001 ether; // 0.001 CELO (~$0.001)
    uint256 public platformFeeBps = 500;          // 5 %

    uint256 private _msgCounter;
    uint256 private _wallCounter;

    // creator => inbox
    mapping(address => Message[])  private _inbox;
    // creator => wall
    mapping(address => WallPost[]) private _wall;

    // creator => claimable earnings (wei)
    mapping(address => uint256) private _earnings;

    // total platform fees sitting in contract (wei)
    uint256 public platformFeesAccrued;

    // like deduplication: keccak256(creator, wallIndex) => liker => bool
    mapping(bytes32 => mapping(address => bool)) private _liked;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MessageSent(
        address indexed creator,
        uint256 indexed messageId,
        bool    isPriority,
        uint256 fee,
        uint256 timestamp
    );

    event MessageReplied(
        address indexed creator,
        uint256 indexed messageId,
        uint256 timestamp
    );

    event MessagePublished(
        address indexed creator,
        uint256 indexed messageId,
        uint256 indexed wallPostId,
        uint256 timestamp
    );

    event MessageArchived(
        address indexed creator,
        uint256 indexed messageId
    );

    event WallPostLiked(
        address indexed creator,
        uint256 indexed wallPostId,
        address indexed liker,
        uint256 newLikeCount
    );

    event EarningsClaimed(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event PriorityFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeUpdated(uint256 oldBps, uint256 newBps);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error CreatorNotRegistered();
    error IndexOutOfBounds();
    error MessageArchived_();
    error MessageAlreadyAnswered();
    error MessageNotAnswered();
    error MessageAlreadyPublished();
    error InsufficientPriorityFee();
    error NoEarningsToWithdraw();
    error AlreadyLiked();
    error ContentEmpty();
    error ContentTooLong();
    error TransferFailed();
    error FeeTooHigh();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier registeredCreator(address _creator) {
        if (!registry.isRegistered(_creator)) revert CreatorNotRegistered();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = VeildRegistry(_registry);
    }

    // ─── External: Messaging ──────────────────────────────────────────────────

    /**
     * @notice Send a free anonymous message to a registered creator.
     * @dev msg.sender is NOT stored; anonymity is by design.
     */
    function sendMessage(
        address _creator,
        string calldata _content
    ) external whenNotPaused registeredCreator(_creator) {
        _validateContent(_content);

        uint256 id = _msgCounter++;
        _inbox[_creator].push(_newMessage(id, _content, false, 0));

        emit MessageSent(_creator, id, false, 0, block.timestamp);
    }

    /**
     * @notice Send a priority message with a CELO payment.
     * @dev Surplus above priorityFee is accepted but only priorityFee is
     *      split; any excess is treated as additional creator earnings.
     */
    function sendPriorityMessage(
        address _creator,
        string calldata _content
    ) external payable whenNotPaused nonReentrant registeredCreator(_creator) {
        if (msg.value < priorityFee) revert InsufficientPriorityFee();
        _validateContent(_content);

        uint256 platformCut = (msg.value * platformFeeBps) / 10_000;
        uint256 creatorCut  = msg.value - platformCut;

        _earnings[_creator]  += creatorCut;
        platformFeesAccrued  += platformCut;

        uint256 id = _msgCounter++;
        _inbox[_creator].push(_newMessage(id, _content, true, msg.value));

        emit MessageSent(_creator, id, true, msg.value, block.timestamp);
    }

    // ─── External: Creator actions ────────────────────────────────────────────

    /**
     * @notice Reply to a message in the caller's inbox.
     * @param _index      Index of the message in the caller's inbox array.
     * @param _reply      Reply text.
     * @param _publish    If true, also publish the Q&A to the public wall.
     */
    function replyToMessage(
        uint256 _index,
        string calldata _reply,
        bool _publish
    ) external whenNotPaused nonReentrant {
        Message storage m = _getOwnMessage(msg.sender, _index);
        if (m.isAnswered) revert MessageAlreadyAnswered();
        _validateContent(_reply);

        m.reply      = _reply;
        m.isAnswered = true;
        m.repliedAt  = block.timestamp;

        emit MessageReplied(msg.sender, m.id, block.timestamp);

        if (_publish) {
            _doPublish(msg.sender, _index);
        }
    }

    /**
     * @notice Publish an already-answered message to the creator's public wall.
     * @param _index Index of the message in the caller's inbox array.
     */
    function publishToWall(uint256 _index) external whenNotPaused {
        Message storage m = _getOwnMessage(msg.sender, _index);
        if (!m.isAnswered)  revert MessageNotAnswered();
        if (m.isPublished)  revert MessageAlreadyPublished();

        _doPublish(msg.sender, _index);
    }

    /**
     * @notice Archive a message (removes it from the active inbox view).
     * @param _index Index of the message in the caller's inbox array.
     */
    function archiveMessage(uint256 _index) external {
        Message storage m = _getOwnMessage(msg.sender, _index);
        if (m.isArchived) revert MessageArchived_();

        m.isArchived = true;
        emit MessageArchived(msg.sender, m.id);
    }

    /**
     * @notice Like a wall post. Each address can like once per post.
     * @param _creator    Address of the creator who owns the wall.
     * @param _wallIndex  Index of the wall post in the creator's wall array.
     */
    function likeWallPost(address _creator, uint256 _wallIndex)
        external
        whenNotPaused
    {
        WallPost[] storage wall = _wall[_creator];
        if (_wallIndex >= wall.length) revert IndexOutOfBounds();

        bytes32 key = keccak256(abi.encodePacked(_creator, _wallIndex));
        if (_liked[key][msg.sender]) revert AlreadyLiked();

        _liked[key][msg.sender] = true;
        wall[_wallIndex].likes++;

        emit WallPostLiked(
            _creator,
            wall[_wallIndex].id,
            msg.sender,
            wall[_wallIndex].likes
        );
    }

    /**
     * @notice Claim accumulated earnings from priority messages.
     */
    function claimEarnings() external nonReentrant {
        uint256 amount = _earnings[msg.sender];
        if (amount == 0) revert NoEarningsToWithdraw();

        _earnings[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EarningsClaimed(msg.sender, amount, block.timestamp);
    }

    // ─── External: Admin ──────────────────────────────────────────────────────

    function setPriorityFee(uint256 _fee) external onlyOwner {
        emit PriorityFeeUpdated(priorityFee, _fee);
        priorityFee = _fee;
    }

    function setPlatformFee(uint256 _bps) external onlyOwner {
        if (_bps > MAX_PLATFORM_BPS) revert FeeTooHigh();
        emit PlatformFeeUpdated(platformFeeBps, _bps);
        platformFeeBps = _bps;
    }

    /**
     * @notice Withdraw accumulated platform fees to the owner wallet.
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeesAccrued;
        if (amount == 0) revert NoEarningsToWithdraw();

        platformFeesAccrued = 0;
        (bool ok,) = payable(owner()).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause()   external onlyOwner { _pause();   }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Returns all messages in a creator's inbox.
     */
    function getInbox(address _creator)
        external view
        returns (Message[] memory)
    {
        return _inbox[_creator];
    }

    /**
     * @notice Returns a single message by index.
     */
    function getMessage(address _creator, uint256 _index)
        external view
        returns (Message memory)
    {
        if (_index >= _inbox[_creator].length) revert IndexOutOfBounds();
        return _inbox[_creator][_index];
    }

    /**
     * @notice Returns all posts on a creator's public wall.
     */
    function getWall(address _creator)
        external view
        returns (WallPost[] memory)
    {
        return _wall[_creator];
    }

    /**
     * @notice Returns a single wall post by index.
     */
    function getWallPost(address _creator, uint256 _index)
        external view
        returns (WallPost memory)
    {
        if (_index >= _wall[_creator].length) revert IndexOutOfBounds();
        return _wall[_creator][_index];
    }

    /**
     * @notice Summary stats for a creator's inbox.
     */
    function getInboxStats(address _creator)
        external view
        returns (InboxStats memory stats)
    {
        Message[] storage inbox = _inbox[_creator];
        uint256 len = inbox.length;
        stats.total          = len;
        stats.pendingEarnings = _earnings[_creator];

        for (uint256 i; i < len; i++) {
            if (inbox[i].isArchived) continue;
            if (!inbox[i].isAnswered) stats.unread++;
            if (inbox[i].isPriority)  stats.priorityCount++;
            if (inbox[i].isPublished) stats.publishedCount++;
        }
    }

    /**
     * @notice Returns claimable earnings for a creator.
     */
    function getEarnings(address _creator) external view returns (uint256) {
        return _earnings[_creator];
    }

    /**
     * @notice Returns inbox and wall lengths (cheaper than full array reads).
     */
    function getLengths(address _creator)
        external view
        returns (uint256 inboxLen, uint256 wallLen)
    {
        inboxLen = _inbox[_creator].length;
        wallLen  = _wall[_creator].length;
    }

    /**
     * @notice Check if an address has liked a specific wall post.
     */
    function hasLiked(address _creator, uint256 _wallIndex, address _user)
        external view
        returns (bool)
    {
        bytes32 key = keccak256(abi.encodePacked(_creator, _wallIndex));
        return _liked[key][_user];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _newMessage(
        uint256 _id,
        string calldata _content,
        bool _isPriority,
        uint256 _fee
    ) internal view returns (Message memory m) {
        m.id         = _id;
        m.content    = _content;
        m.isPriority = _isPriority;
        m.fee        = _fee;
        m.sentAt     = block.timestamp;
        // reply, repliedAt, isAnswered, isPublished, isArchived are all zero/false
    }

    function _getOwnMessage(address _creator, uint256 _index)
        internal view
        returns (Message storage m)
    {
        Message[] storage inbox = _inbox[_creator];
        if (_index >= inbox.length) revert IndexOutOfBounds();
        m = inbox[_index];
        if (m.isArchived) revert MessageArchived_();
    }

    function _doPublish(address _creator, uint256 _msgIndex) internal {
        Message storage m = _inbox[_creator][_msgIndex];
        m.isPublished = true;

        uint256 wallId = _wallCounter++;
        _wall[_creator].push(WallPost({
            id:          wallId,
            messageId:   m.id,
            question:    m.content,
            answer:      m.reply,
            likes:       0,
            publishedAt: block.timestamp
        }));

        emit MessagePublished(_creator, m.id, wallId, block.timestamp);
    }

    function _validateContent(string calldata _content) internal pure {
        uint256 len = bytes(_content).length;
        if (len == 0)             revert ContentEmpty();
        if (len > MAX_CONTENT_LEN) revert ContentTooLong();
    }
}
