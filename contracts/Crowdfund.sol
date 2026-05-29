// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title Crowdfund
 * @notice Raise toward an encrypted goal with private contribution amounts.
 *
 * The campaign's goal and running total are encrypted; the number of
 * contributors is public, but how much each gave (and the aggregate) stays
 * sealed. The owner can check "goal reached?" as an encrypted boolean without
 * revealing the total. Implemented from scratch on CoFHE. Amounts are whole
 * USDC (euint32).
 */
contract Crowdfund {
    struct Campaign {
        address owner;
        string  title;
        uint256 contributorCount; // public participation count
        bool    exists;
    }

    Campaign[] public campaigns;
    mapping(uint256 => euint32) internal goal;
    mapping(uint256 => euint32) internal raised;
    mapping(uint256 => mapping(address => euint32)) internal contribution;
    mapping(uint256 => mapping(address => bool))    public  hasContributed;

    mapping(uint256 => ebool) internal goalReached;
    mapping(uint256 => bool)  public  goalChecked;

    event CampaignCreated(uint256 indexed id, address indexed owner, string title);
    event Contributed(uint256 indexed id, address indexed contributor);
    event GoalChecked(uint256 indexed id);

    error BadId();
    error NotOwner();
    error NothingContributed();
    error NotChecked();

    function createCampaign(InEuint32 memory _goal, string calldata title) external returns (uint256 id) {
        euint32 g = FHE.asEuint32(_goal);
        FHE.allowThis(g);
        FHE.allow(g, msg.sender);

        id = campaigns.length;
        campaigns.push(Campaign({ owner: msg.sender, title: title, contributorCount: 0, exists: true }));
        goal[id] = g;
        raised[id] = FHE.asEuint32(0);
        FHE.allowThis(raised[id]);
        FHE.allow(raised[id], msg.sender);
        emit CampaignCreated(id, msg.sender, title);
    }

    /// @notice Contribute an encrypted amount. Participation is public; the amount is not.
    function contribute(uint256 id, InEuint32 memory amount) external {
        if (id >= campaigns.length) revert BadId();
        Campaign storage c = campaigns[id];

        euint32 amt = FHE.asEuint32(amount);

        euint32 newRaised = FHE.add(raised[id], amt);
        raised[id] = newRaised;
        FHE.allowThis(newRaised);
        FHE.allow(newRaised, c.owner);

        euint32 mine = hasContributed[id][msg.sender] ? FHE.add(contribution[id][msg.sender], amt) : amt;
        contribution[id][msg.sender] = mine;
        FHE.allowThis(mine);
        FHE.allow(mine, msg.sender);

        if (!hasContributed[id][msg.sender]) {
            hasContributed[id][msg.sender] = true;
            c.contributorCount++;
        }
        emit Contributed(id, msg.sender);
    }

    /// @notice Owner: compute whether the (encrypted) total has reached the goal.
    function checkGoalReached(uint256 id) external {
        if (id >= campaigns.length) revert BadId();
        if (campaigns[id].owner != msg.sender) revert NotOwner();
        ebool reached = FHE.gte(raised[id], goal[id]);
        FHE.allowThis(reached);
        FHE.allow(reached, msg.sender);
        goalReached[id] = reached;
        goalChecked[id] = true;
        emit GoalChecked(id);
    }

    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /// @notice Encrypted total raised (owner only).
    function getRaised(uint256 id) external view returns (euint32) {
        if (id >= campaigns.length) revert BadId();
        if (campaigns[id].owner != msg.sender) revert NotOwner();
        return raised[id];
    }

    /// @notice Your own encrypted contribution to a campaign.
    function getMyContribution(uint256 id) external view returns (euint32) {
        if (!hasContributed[id][msg.sender]) revert NothingContributed();
        return contribution[id][msg.sender];
    }

    /// @notice Encrypted "goal reached?" boolean (owner only, after checkGoalReached).
    function getGoalReached(uint256 id) external view returns (ebool) {
        if (!goalChecked[id]) revert NotChecked();
        if (campaigns[id].owner != msg.sender) revert NotOwner();
        return goalReached[id];
    }
}
