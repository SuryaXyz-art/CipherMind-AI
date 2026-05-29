// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ConfidentialPayroll
 * @notice Run payroll for a team where each person's salary is encrypted.
 *
 * An employer creates a run and assigns each employee an encrypted allocation
 * (`euint32`). Employees claim into their own encrypted salary balance. No one
 * — not other employees, not an observer of the chain — learns any individual
 * figure; only the recipient (and the employer who set it) can unseal their
 * number. Inspired by confidential-payroll designs in the FHE ecosystem;
 * implemented from scratch on CoFHE.
 */
contract ConfidentialPayroll {
    struct Run {
        address employer;
        uint256 employeeCount;
        bool    exists;
        string  label;
    }

    mapping(uint256 => Run) public runs;
    uint256 public runCount;

    // runId => employee => encrypted allocation
    mapping(uint256 => mapping(address => euint32)) internal allocation;
    mapping(uint256 => mapping(address => bool))    public  isEmployee;
    mapping(uint256 => mapping(address => bool))    public  claimed;

    // Claimed, accumulated encrypted salary per recipient (across runs).
    mapping(address => euint32) internal salaryBalance;
    mapping(address => bool)    public  hasSalary;

    event RunCreated(uint256 indexed runId, address indexed employer, string label);
    event AllocationSet(uint256 indexed runId, address indexed employee);
    event Claimed(uint256 indexed runId, address indexed employee);

    error NotEmployer();
    error NoRun();
    error NotAllocated();
    error AlreadyClaimed();
    error NoSalary();

    // ── Employer ──────────────────────────────────────────────────────────

    function createRun(string calldata label) external returns (uint256 runId) {
        runId = runCount++;
        runs[runId] = Run({ employer: msg.sender, employeeCount: 0, exists: true, label: label });
        emit RunCreated(runId, msg.sender, label);
    }

    /**
     * @notice Assign an employee an encrypted salary for this run.
     * @dev Only the run's employer. The amount is encrypted client-side; both
     *      the contract and the employee are granted decrypt access.
     */
    function setAllocation(uint256 runId, address employee, InEuint32 memory amount) external {
        Run storage r = runs[runId];
        if (!r.exists) revert NoRun();
        if (r.employer != msg.sender) revert NotEmployer();

        euint32 amt = FHE.asEuint32(amount);
        FHE.allowThis(amt);
        FHE.allow(amt, employee); // employee can preview their own figure
        FHE.allow(amt, msg.sender); // employer keeps access to what they set

        allocation[runId][employee] = amt;
        if (!isEmployee[runId][employee]) {
            isEmployee[runId][employee] = true;
            r.employeeCount++;
        }
        claimed[runId][employee] = false;
        emit AllocationSet(runId, employee);
    }

    /// @notice Preview your own encrypted allocation for a run (unseal off-chain).
    function getAllocation(uint256 runId) external view returns (euint32) {
        if (!isEmployee[runId][msg.sender]) revert NotAllocated();
        return allocation[runId][msg.sender];
    }

    // ── Employee ────────────────────────────────────────────────────────────

    /**
     * @notice Claim your encrypted salary for a run into your salary balance.
     */
    function claim(uint256 runId) external {
        if (!isEmployee[runId][msg.sender]) revert NotAllocated();
        if (claimed[runId][msg.sender]) revert AlreadyClaimed();

        euint32 amt = allocation[runId][msg.sender];
        euint32 bal = hasSalary[msg.sender] ? FHE.add(salaryBalance[msg.sender], amt) : amt;

        salaryBalance[msg.sender] = bal;
        hasSalary[msg.sender] = true;
        FHE.allowThis(bal);
        FHE.allow(bal, msg.sender);

        claimed[runId][msg.sender] = true;
        emit Claimed(runId, msg.sender);
    }

    /// @notice Your accumulated encrypted salary (unseal off-chain with your permit).
    function getEncryptedSalary() external view returns (euint32) {
        if (!hasSalary[msg.sender]) revert NoSalary();
        return salaryBalance[msg.sender];
    }

    /// @notice Grant one viewer (e.g. a lender or tax tool) access to your salary.
    function grantSalaryAccess(address viewer) external {
        if (!hasSalary[msg.sender]) revert NoSalary();
        FHE.allow(salaryBalance[msg.sender], viewer);
    }
}
