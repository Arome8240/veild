// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeildFeeDistributor
 * @notice Collects platform fees from all Veild contracts and distributes
 *         them to designated recipients (treasury, dev fund, burn address)
 *         according to fixed basis-point splits.
 */
contract VeildFeeDistributor is Ownable, ReentrancyGuard {
    uint256 public constant BPS = 10_000;

    struct Recipient {
        address payable addr;
        uint256 bps;
        string  label;
    }

    Recipient[] public recipients;

    error InvalidRecipient();
    error SplitsMustSumTo10000();
    error TransferFailed();
    error NoBalance();

    event Distributed(uint256 total, uint256 timestamp);
    event RecipientUpdated(uint256 index, address addr, uint256 bps);

    constructor(address initialOwner) Ownable(initialOwner) {
        // Default: 60% treasury, 30% dev fund, 10% reserve
        recipients.push(Recipient(payable(initialOwner), 6_000, "treasury"));
        recipients.push(Recipient(payable(initialOwner), 3_000, "dev"));
        recipients.push(Recipient(payable(initialOwner), 1_000, "reserve"));
    }

    receive() external payable {}

    function distribute() external nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalance();

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 share = (balance * recipients[i].bps) / BPS;
            if (share == 0) continue;
            (bool ok,) = recipients[i].addr.call{value: share}("");
            if (!ok) revert TransferFailed();
        }

        emit Distributed(balance, block.timestamp);
    }

    function setRecipient(
        uint256 index,
        address payable addr,
        uint256 bps,
        string calldata label
    ) external onlyOwner {
        if (addr == address(0)) revert InvalidRecipient();
        recipients[index] = Recipient(addr, bps, label);
        _validateSplits();
        emit RecipientUpdated(index, addr, bps);
    }

    function recipientCount() external view returns (uint256) {
        return recipients.length;
    }

    function _validateSplits() internal view {
        uint256 total;
        for (uint256 i = 0; i < recipients.length; i++) {
            total += recipients[i].bps;
        }
        if (total != BPS) revert SplitsMustSumTo10000();
    }
}
