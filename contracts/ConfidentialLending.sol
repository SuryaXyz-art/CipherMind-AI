// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ConfidentialLending
 * @notice Borrow against collateral while keeping collateral, debt, and your
 *         health factor encrypted on-chain.
 *
 * Inspired by confidential-lending designs in the FHE ecosystem (e.g. Walnut),
 * implemented from scratch on CoFHE. Collateral is deposited as public USDC and
 * immediately becomes an encrypted balance. Borrowing is allowed up to a 75%
 * LTV, enforced by an FHE comparison — over-borrowing silently grants 0 instead
 * of reverting, so the attempt leaks nothing. Debt and the health check are
 * encrypted; only the borrower can unseal them.
 *
 * Amounts are whole USDC (euint32), demo-scale.
 */
contract ConfidentialLending {
    IERC20 public immutable usdc;

    mapping(address => euint32) internal collateral;
    mapping(address => euint32) internal debt;        // outstanding borrowed amount
    mapping(address => euint32) internal borrowable;  // drawn funds (encrypted)
    mapping(address => bool)    public  hasPosition;

    mapping(address => ebool) internal healthy;
    mapping(address => bool)  public  healthReady;

    event CollateralDeposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user);
    event Repaid(address indexed user);
    event HealthChecked(address indexed user);

    error BadAmount();
    error TransferFailed();
    error NoPosition();
    error NotReady();

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    /// @dev Max borrow = 75% of collateral, computed as collateral - collateral/4
    ///      to avoid multiplication overflow on euint32.
    function _maxBorrow(address user) internal returns (euint32) {
        euint32 c = collateral[user];
        return FHE.sub(c, FHE.div(c, FHE.asEuint32(4)));
    }

    // ── Collateral ────────────────────────────────────────────────────────

    function depositCollateral(uint256 amount) external {
        if (amount == 0 || amount > type(uint32).max) revert BadAmount();
        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        euint32 add = FHE.asEuint32(uint32(amount));
        euint32 c = hasPosition[msg.sender] ? FHE.add(collateral[msg.sender], add) : add;
        collateral[msg.sender] = c;
        if (!hasPosition[msg.sender]) {
            debt[msg.sender] = FHE.asEuint32(0);
            borrowable[msg.sender] = FHE.asEuint32(0);
            hasPosition[msg.sender] = true;
        }
        FHE.allowThis(c);
        FHE.allow(c, msg.sender);
        FHE.allowThis(debt[msg.sender]);
        FHE.allowThis(borrowable[msg.sender]);
        emit CollateralDeposited(msg.sender, amount);
    }

    // ── Borrow / repay ──────────────────────────────────────────────────────

    /**
     * @notice Borrow an encrypted amount. If it would exceed 75% LTV, 0 is
     *         drawn (silent, no leak).
     */
    function borrow(InEuint32 memory encAmount) external {
        if (!hasPosition[msg.sender]) revert NoPosition();

        euint32 req = FHE.asEuint32(encAmount);
        euint32 newDebt = FHE.add(debt[msg.sender], req);
        ebool ok = FHE.lte(newDebt, _maxBorrow(msg.sender));
        euint32 granted = FHE.select(ok, req, FHE.asEuint32(0));

        debt[msg.sender] = FHE.add(debt[msg.sender], granted);
        borrowable[msg.sender] = FHE.add(borrowable[msg.sender], granted);

        FHE.allowThis(debt[msg.sender]);
        FHE.allow(debt[msg.sender], msg.sender);
        FHE.allowThis(borrowable[msg.sender]);
        FHE.allow(borrowable[msg.sender], msg.sender);
        emit Borrowed(msg.sender);
    }

    /**
     * @notice Repay an encrypted amount toward your debt (capped at your debt).
     */
    function repay(InEuint32 memory encAmount) external {
        if (!hasPosition[msg.sender]) revert NoPosition();

        euint32 amt = FHE.asEuint32(encAmount);
        ebool within = FHE.lte(amt, debt[msg.sender]);
        euint32 pay = FHE.select(within, amt, debt[msg.sender]);

        debt[msg.sender] = FHE.sub(debt[msg.sender], pay);
        FHE.allowThis(debt[msg.sender]);
        FHE.allow(debt[msg.sender], msg.sender);
        emit Repaid(msg.sender);
    }

    // ── Health check ──────────────────────────────────────────────────────

    /**
     * @notice Compute whether your position is healthy (debt <= 75% of
     *         collateral) as an encrypted boolean only you can unseal.
     */
    function checkHealth() external {
        if (!hasPosition[msg.sender]) revert NoPosition();
        ebool ok = FHE.lte(debt[msg.sender], _maxBorrow(msg.sender));
        FHE.allowThis(ok);
        FHE.allow(ok, msg.sender);
        healthy[msg.sender] = ok;
        healthReady[msg.sender] = true;
        emit HealthChecked(msg.sender);
    }

    // ── Views (encrypted handles, unseal off-chain) ──────────────────────

    function getEncryptedCollateral() external view returns (euint32) {
        if (!hasPosition[msg.sender]) revert NoPosition();
        return collateral[msg.sender];
    }

    function getEncryptedDebt() external view returns (euint32) {
        if (!hasPosition[msg.sender]) revert NoPosition();
        return debt[msg.sender];
    }

    function getEncryptedBorrowable() external view returns (euint32) {
        if (!hasPosition[msg.sender]) revert NoPosition();
        return borrowable[msg.sender];
    }

    function getHealth() external view returns (ebool) {
        if (!healthReady[msg.sender]) revert NotReady();
        return healthy[msg.sender];
    }
}
