// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ReputationRegistry
 * @notice A private, anonymous reputation / trust layer.
 *
 * Peers attest to each other with encrypted points; a subject's reputation
 * accrues as an encrypted euint32 that only they (and addresses they grant) can
 * read. A user can prove "reputation >= threshold" as an encrypted boolean —
 * a private trust metric for lending or access — without revealing the score.
 * Self-attestation is blocked. The attestation count is public; amounts are not.
 * Implemented from scratch on CoFHE, extending CipherMind's threshold-proof idea.
 */
contract ReputationRegistry {
    mapping(address => euint32) internal reputation;
    mapping(address => bool)    public  hasReputation;
    mapping(address => uint256) public  attestationCount; // public participation

    mapping(address => ebool) internal proofResult;
    mapping(address => bool)  public  proofReady;

    event Attested(address indexed attester, address indexed subject);
    event ProofComputed(address indexed subject);
    event AccessGranted(address indexed owner, address indexed viewer);

    error SelfAttest();
    error NoReputation();
    error ProofNotReady();

    /// @notice Vouch for `subject` with an encrypted number of reputation points.
    function attest(address subject, InEuint32 memory points) external {
        if (subject == msg.sender) revert SelfAttest();
        euint32 p = FHE.asEuint32(points);
        euint32 r = hasReputation[subject] ? FHE.add(reputation[subject], p) : p;
        reputation[subject] = r;
        hasReputation[subject] = true;
        FHE.allowThis(r);
        FHE.allow(r, subject);
        attestationCount[subject]++;
        emit Attested(msg.sender, subject);
    }

    /// @notice Prove your reputation is >= an encrypted threshold (encrypted bool).
    function proveAtLeast(InEuint32 memory threshold) external {
        if (!hasReputation[msg.sender]) revert NoReputation();
        ebool ok = FHE.gte(reputation[msg.sender], FHE.asEuint32(threshold));
        FHE.allowThis(ok);
        FHE.allow(ok, msg.sender);
        proofResult[msg.sender] = ok;
        proofReady[msg.sender] = true;
        emit ProofComputed(msg.sender);
    }

    /// @notice Your encrypted reputation handle (unseal off-chain with your permit).
    function getReputation() external view returns (euint32) {
        if (!hasReputation[msg.sender]) revert NoReputation();
        return reputation[msg.sender];
    }

    /// @notice Encrypted result of your latest threshold proof.
    function getProof() external view returns (ebool) {
        if (!proofReady[msg.sender]) revert ProofNotReady();
        return proofResult[msg.sender];
    }

    /// @notice Grant one viewer (e.g. a lender) the right to unseal your reputation.
    function grantAccess(address viewer) external {
        if (!hasReputation[msg.sender]) revert NoReputation();
        FHE.allow(reputation[msg.sender], viewer);
        emit AccessGranted(msg.sender, viewer);
    }
}
