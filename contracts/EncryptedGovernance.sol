// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title EncryptedGovernance
 * @notice Confidential DAO voting.
 *
 * Each voter submits an encrypted choice; the contract only ever stores the
 * encrypted running tallies (yes / no) — never an individual's vote — so how
 * anyone voted stays private by construction. The aggregate result is made
 * public only when a proposal is finalized. Any non-zero encrypted choice
 * counts as "yes", zero as "no" (clamped on-chain). One vote per address.
 * Implemented from scratch on CoFHE.
 */
contract EncryptedGovernance {
    struct Proposal {
        address proposer;
        string  title;
        uint256 voters;   // public participation count
        bool    finalized;
        bool    exists;
    }

    Proposal[] public proposals;
    mapping(uint256 => euint32) internal yesVotes;
    mapping(uint256 => euint32) internal noVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event Voted(uint256 indexed id, address indexed voter);
    event Finalized(uint256 indexed id);

    error BadId();
    error AlreadyFinalized();
    error AlreadyVoted();
    error NotFinalized();

    function createProposal(string calldata title) external returns (uint256 id) {
        id = proposals.length;
        proposals.push(Proposal({ proposer: msg.sender, title: title, voters: 0, finalized: false, exists: true }));
        yesVotes[id] = FHE.asEuint32(0);
        noVotes[id] = FHE.asEuint32(0);
        FHE.allowThis(yesVotes[id]);
        FHE.allowThis(noVotes[id]);
        emit ProposalCreated(id, msg.sender, title);
    }

    /**
     * @notice Cast an encrypted vote. Any non-zero choice counts as yes, zero as no.
     */
    function vote(uint256 id, InEuint32 memory choice) external {
        if (id >= proposals.length) revert BadId();
        Proposal storage p = proposals[id];
        if (p.finalized) revert AlreadyFinalized();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();

        euint32 c = FHE.asEuint32(choice);
        ebool isYes = FHE.gt(c, FHE.asEuint32(0));
        euint32 yes = FHE.select(isYes, FHE.asEuint32(1), FHE.asEuint32(0));
        euint32 no  = FHE.select(isYes, FHE.asEuint32(0), FHE.asEuint32(1));

        yesVotes[id] = FHE.add(yesVotes[id], yes);
        noVotes[id]  = FHE.add(noVotes[id], no);
        FHE.allowThis(yesVotes[id]);
        FHE.allowThis(noVotes[id]);

        hasVoted[id][msg.sender] = true;
        p.voters++;
        emit Voted(id, msg.sender);
    }

    /**
     * @notice Finalize a proposal and make the aggregate tally publicly decryptable.
     *         Individual votes were never stored, so only the totals are revealed.
     */
    function finalize(uint256 id) external {
        if (id >= proposals.length) revert BadId();
        Proposal storage p = proposals[id];
        if (p.finalized) revert AlreadyFinalized();
        FHE.allowPublic(yesVotes[id]);
        FHE.allowPublic(noVotes[id]);
        p.finalized = true;
        emit Finalized(id);
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /// @notice Encrypted yes-tally handle (publicly decryptable once finalized).
    function getYes(uint256 id) external view returns (euint32) {
        if (id >= proposals.length) revert BadId();
        if (!proposals[id].finalized) revert NotFinalized();
        return yesVotes[id];
    }

    /// @notice Encrypted no-tally handle (publicly decryptable once finalized).
    function getNo(uint256 id) external view returns (euint32) {
        if (id >= proposals.length) revert BadId();
        if (!proposals[id].finalized) revert NotFinalized();
        return noVotes[id];
    }
}
