// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title PaymentRequests
 * @notice Request a payment with a public memo but an encrypted amount.
 *
 * A requester posts how much they want (encrypted) plus a human-readable memo;
 * anyone can fulfill it. The memo and who paid are public; the amount stays
 * sealed — only the requester can unseal what they asked for and what they've
 * received. Implemented from scratch on CoFHE. Amounts are whole USDC (euint32).
 */
contract PaymentRequests {
    struct Request {
        address requester;
        string  memo;
        bool    fulfilled;
        bool    cancelled;
        address payer;
    }

    Request[] public requests;
    mapping(uint256 => euint32) internal amountOf;       // encrypted requested amount
    mapping(address => euint32) internal received;       // encrypted total received
    mapping(address => bool)    public  hasReceived;

    event RequestCreated(uint256 indexed id, address indexed requester, string memo);
    event RequestPaid(uint256 indexed id, address indexed payer);
    event RequestCancelled(uint256 indexed id);

    error NotRequester();
    error NotOpen();
    error NoneReceived();
    error BadId();

    /// @notice Create a payment request with an encrypted amount + public memo.
    function createRequest(InEuint32 memory amount, string calldata memo) external returns (uint256 id) {
        euint32 amt = FHE.asEuint32(amount);
        FHE.allowThis(amt);
        FHE.allow(amt, msg.sender); // requester can preview their own ask

        id = requests.length;
        requests.push(Request({ requester: msg.sender, memo: memo, fulfilled: false, cancelled: false, payer: address(0) }));
        amountOf[id] = amt;
        emit RequestCreated(id, msg.sender, memo);
    }

    /// @notice Fulfill a request; the requester's encrypted balance grows by the asked amount.
    function pay(uint256 id) external {
        if (id >= requests.length) revert BadId();
        Request storage r = requests[id];
        if (r.fulfilled || r.cancelled) revert NotOpen();

        euint32 amt = amountOf[id];
        euint32 bal = hasReceived[r.requester] ? FHE.add(received[r.requester], amt) : amt;
        received[r.requester] = bal;
        hasReceived[r.requester] = true;
        FHE.allowThis(bal);
        FHE.allow(bal, r.requester);

        r.fulfilled = true;
        r.payer = msg.sender;
        emit RequestPaid(id, msg.sender);
    }

    /// @notice Requester cancels an unfulfilled request.
    function cancel(uint256 id) external {
        if (id >= requests.length) revert BadId();
        Request storage r = requests[id];
        if (r.requester != msg.sender) revert NotRequester();
        if (r.fulfilled || r.cancelled) revert NotOpen();
        r.cancelled = true;
        emit RequestCancelled(id);
    }

    function requestCount() external view returns (uint256) {
        return requests.length;
    }

    /// @notice The requested amount (encrypted handle) — only the requester.
    function getRequestedAmount(uint256 id) external view returns (euint32) {
        if (id >= requests.length) revert BadId();
        if (requests[id].requester != msg.sender) revert NotRequester();
        return amountOf[id];
    }

    /// @notice Your total received across fulfilled requests (encrypted handle).
    function getReceived() external view returns (euint32) {
        if (!hasReceived[msg.sender]) revert NoneReceived();
        return received[msg.sender];
    }
}
