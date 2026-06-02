// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VeildRegistry
 * @notice Stores on-chain creator profiles for the Veild anonymous messaging platform.
 *         Any wallet can register as a creator. The platform owner can verify creators.
 */
contract VeildRegistry is Ownable, Pausable {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Creator {
        string  username;       // unique handle (max 32 chars)
        string  name;           // display name
        string  bio;            // short bio (max 280 chars)
        string  avatarCID;      // IPFS CID of avatar image
        string  category;       // e.g. "Art & Design", "Music"
        uint256 joinedAt;       // block.timestamp of registration
        uint256 totalMessages;  // incremented by VeildMessages
        bool    isVerified;     // set by platform owner
        bool    isActive;       // false = deactivated
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(address  => Creator)  private _creators;
    mapping(bytes32  => address)  private _usernameIndex; // keccak256(username) => addr
    address[] private _creatorList;

    uint256 public registrationFee;   // wei; 0 = free
    uint256 public totalCreators;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CreatorRegistered(address indexed creator, string username, uint256 timestamp);
    event ProfileUpdated(address indexed creator, uint256 timestamp);
    event CreatorVerified(address indexed creator, bool verified);
    event CreatorDeactivated(address indexed creator);
    event RegistrationFeeUpdated(uint256 oldFee, uint256 newFee);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyRegistered();
    error NotRegistered();
    error InvalidUsername();
    error UsernameTaken(string username);
    error InsufficientFee();
    error TransferFailed();
    error Unauthorized();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyActiveCreator() {
        if (!_creators[msg.sender].isActive) revert NotRegistered();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External: Creator actions ────────────────────────────────────────────

    /**
     * @notice Register the caller as a creator.
     * @param _username Unique handle, 1–32 alphanumeric/underscore characters.
     * @param _name     Display name.
     * @param _bio      Short bio (max 280 chars).
     * @param _avatarCID IPFS CID of the avatar image.
     * @param _category Creator category tag.
     */
    function register(
        string calldata _username,
        string calldata _name,
        string calldata _bio,
        string calldata _avatarCID,
        string calldata _category
    ) external payable whenNotPaused {
        if (_creators[msg.sender].isActive) revert AlreadyRegistered();
        if (msg.value < registrationFee)    revert InsufficientFee();

        uint256 uLen = bytes(_username).length;
        if (uLen == 0 || uLen > 32) revert InvalidUsername();

        bytes32 uHash = keccak256(bytes(_username));
        if (_usernameIndex[uHash] != address(0)) revert UsernameTaken(_username);

        _usernameIndex[uHash] = msg.sender;
        _creatorList.push(msg.sender);
        totalCreators++;

        _creators[msg.sender] = Creator({
            username:      _username,
            name:          _name,
            bio:           _bio,
            avatarCID:     _avatarCID,
            category:      _category,
            joinedAt:      block.timestamp,
            totalMessages: 0,
            isVerified:    false,
            isActive:      true
        });

        emit CreatorRegistered(msg.sender, _username, block.timestamp);
    }

    /**
     * @notice Update the caller's profile metadata.
     */
    function updateProfile(
        string calldata _name,
        string calldata _bio,
        string calldata _avatarCID,
        string calldata _category
    ) external onlyActiveCreator whenNotPaused {
        Creator storage c = _creators[msg.sender];
        c.name      = _name;
        c.bio       = _bio;
        c.avatarCID = _avatarCID;
        c.category  = _category;

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Increment a creator's message counter. Called by VeildMessages.
     * @dev Only the VeildMessages contract should call this — enforced via onlyOwner
     *      in production; relax by setting a trusted messenger address if needed.
     */
    function incrementMessageCount(address _creator) external onlyOwner {
        if (_creators[_creator].isActive) {
            _creators[_creator].totalMessages++;
        }
    }

    // ─── External: Owner actions ──────────────────────────────────────────────

    function setVerified(address _creator, bool _verified) external onlyOwner {
        _creators[_creator].isVerified = _verified;
        emit CreatorVerified(_creator, _verified);
    }

    function deactivateCreator(address _creator) external onlyOwner {
        _creators[_creator].isActive = false;
        emit CreatorDeactivated(_creator);
    }

    function setRegistrationFee(uint256 _fee) external onlyOwner {
        emit RegistrationFeeUpdated(registrationFee, _fee);
        registrationFee = _fee;
    }

    function withdraw() external onlyOwner {
        (bool ok,) = payable(owner()).call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }

    function pause()   external onlyOwner { _pause();   }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getCreator(address _addr) external view returns (Creator memory) {
        return _creators[_addr];
    }

    function getCreatorByUsername(string calldata _username)
        external view
        returns (address addr, Creator memory creator)
    {
        addr    = _usernameIndex[keccak256(bytes(_username))];
        creator = _creators[addr];
    }

    function isRegistered(address _addr) external view returns (bool) {
        return _creators[_addr].isActive;
    }

    function getCreatorList(uint256 _offset, uint256 _limit)
        external view
        returns (address[] memory)
    {
        uint256 total = _creatorList.length;
        if (_offset >= total) return new address[](0);
        uint256 end = _offset + _limit > total ? total : _offset + _limit;
        uint256 len = end - _offset;
        address[] memory out = new address[](len);
        for (uint256 i; i < len; i++) {
            out[i] = _creatorList[_offset + i];
        }
        return out;
    }
}
