// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ConfidentialEscrow
 * @notice Two-of-two escrow with an arbiter, over an encrypted amount.
 *
 * A buyer opens a deal naming a seller and an arbiter and sets the (encrypted)
 * amount. When both buyer and seller approve, the funds release to the seller's
 * encrypted balance. If it goes sideways, the arbiter resolves — release to the
 * seller or refund to the buyer. The amount is visible only to the three
 * parties; the public sees the deal exists and its status, never the figure.
 * Implemented from scratch on CoFHE. Amounts are whole USDC (euint32).
 */
contract ConfidentialEscrow {
    enum Status { Pending, Released, Refunded }

    struct Deal {
        address buyer;
        address seller;
        address arbiter;
        bool    buyerApproved;
        bool    sellerApproved;
        Status  status;
        string  memo;
    }

    Deal[] public deals;
    mapping(uint256 => euint32) internal amountOf;
    mapping(address => euint32) internal balance; // released/refunded funds (encrypted)
    mapping(address => bool)    public  hasBalance;

    event DealOpened(uint256 indexed id, address indexed buyer, address indexed seller, string memo);
    event Approved(uint256 indexed id, address indexed party);
    event Released(uint256 indexed id);
    event Refunded(uint256 indexed id);

    error BadId();
    error NotParty();
    error NotArbiter();
    error NotPending();
    error NoBalance();

    function openDeal(address seller, address arbiter, InEuint32 memory amount, string calldata memo)
        external
        returns (uint256 id)
    {
        euint32 amt = FHE.asEuint32(amount);
        FHE.allowThis(amt);
        FHE.allow(amt, msg.sender);
        FHE.allow(amt, seller);
        FHE.allow(amt, arbiter);

        id = deals.length;
        deals.push(Deal({
            buyer: msg.sender, seller: seller, arbiter: arbiter,
            buyerApproved: false, sellerApproved: false, status: Status.Pending, memo: memo
        }));
        amountOf[id] = amt;
        emit DealOpened(id, msg.sender, seller, memo);
    }

    function approve(uint256 id) external {
        if (id >= deals.length) revert BadId();
        Deal storage d = deals[id];
        if (d.status != Status.Pending) revert NotPending();
        if (msg.sender == d.buyer) d.buyerApproved = true;
        else if (msg.sender == d.seller) d.sellerApproved = true;
        else revert NotParty();
        emit Approved(id, msg.sender);

        if (d.buyerApproved && d.sellerApproved) {
            _credit(d.seller, amountOf[id]);
            d.status = Status.Released;
            emit Released(id);
        }
    }

    /// @notice Arbiter resolves a disputed deal: release to seller or refund buyer.
    function resolve(uint256 id, bool releaseToSeller) external {
        if (id >= deals.length) revert BadId();
        Deal storage d = deals[id];
        if (d.status != Status.Pending) revert NotPending();
        if (msg.sender != d.arbiter) revert NotArbiter();

        if (releaseToSeller) {
            _credit(d.seller, amountOf[id]);
            d.status = Status.Released;
            emit Released(id);
        } else {
            _credit(d.buyer, amountOf[id]);
            d.status = Status.Refunded;
            emit Refunded(id);
        }
    }

    function _credit(address who, euint32 amt) internal {
        euint32 bal = hasBalance[who] ? FHE.add(balance[who], amt) : amt;
        balance[who] = bal;
        hasBalance[who] = true;
        FHE.allowThis(bal);
        FHE.allow(bal, who);
    }

    function dealCount() external view returns (uint256) {
        return deals.length;
    }

    /// @notice The escrow amount (encrypted handle) — buyer, seller, or arbiter only.
    function getAmount(uint256 id) external view returns (euint32) {
        if (id >= deals.length) revert BadId();
        Deal storage d = deals[id];
        if (msg.sender != d.buyer && msg.sender != d.seller && msg.sender != d.arbiter) revert NotParty();
        return amountOf[id];
    }

    /// @notice Your released/refunded encrypted balance from settled escrows.
    function getBalance() external view returns (euint32) {
        if (!hasBalance[msg.sender]) revert NoBalance();
        return balance[msg.sender];
    }
}
