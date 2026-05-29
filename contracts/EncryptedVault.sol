// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EncryptedVault
 * @notice The foundation of CipherMind's private-payments surfaces.
 *
 * Users deposit public USDC and receive an encrypted internal balance
 * (`euint32`). From there, balances move as ciphertext: a transfer's amount is
 * encrypted client-side, and the vault adjusts both balances homomorphically.
 * Overdrafts can't leak via revert — an insufficient transfer simply moves 0
 * (selected with `FHE.select`). Each holder can unseal their own balance, prove
 * a threshold, or grant one viewer read access.
 */
contract EncryptedVault {
    IERC20 public immutable usdc;

    mapping(address => euint32) internal balances;
    mapping(address => bool)    public  hasAccount;

    // Balance proof: encrypted "balance >= threshold" result per user.
    mapping(address => ebool) internal proofResult;
    mapping(address => bool)  public  proofReady;

    event Deposited(address indexed user, uint256 amount);
    event PrivateTransfer(address indexed from, address indexed to);
    event BalanceProofReady(address indexed user);
    event BalanceAccessGranted(address indexed owner, address indexed viewer);

    error NoAccount();
    error BadAmount();
    error TransferFailed();
    error ProofNotReady();

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    function _credit(address user, euint32 amount) internal {
        euint32 bal = hasAccount[user] ? FHE.add(balances[user], amount) : amount;
        balances[user] = bal;
        hasAccount[user] = true;
        FHE.allowThis(bal);
        FHE.allow(bal, user);
    }

    // ── Deposit / withdraw (public USDC <-> encrypted balance) ───────────

    /**
     * @notice Deposit public USDC; your internal balance becomes encrypted.
     */
    function deposit(uint256 amount) external {
        if (amount == 0 || amount > type(uint32).max) revert BadAmount();
        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _credit(msg.sender, FHE.asEuint32(uint32(amount)));
        emit Deposited(msg.sender, amount);
    }

    // NOTE: withdraw (encrypted balance -> public USDC) requires CoFHE async
    // decryption to settle safely (you can't branch on an encrypted comparison
    // synchronously without risking an overdraft). It's intentionally omitted
    // here and tracked as a follow-up using the request/callback decrypt flow.

    // ── Private transfer ─────────────────────────────────────────────────

    /**
     * @notice Send an encrypted amount to another address. The amount is
     *         encrypted client-side; if you lack the funds, 0 is moved.
     */
    function send(address to, InEuint32 memory encAmount) external {
        if (!hasAccount[msg.sender]) revert NoAccount();

        euint32 amt = FHE.asEuint32(encAmount);
        ebool ok = FHE.lte(amt, balances[msg.sender]);
        euint32 moved = FHE.select(ok, amt, FHE.asEuint32(0));

        euint32 newFrom = FHE.sub(balances[msg.sender], moved);
        balances[msg.sender] = newFrom;
        FHE.allowThis(newFrom);
        FHE.allow(newFrom, msg.sender);

        _credit(to, moved);
        emit PrivateTransfer(msg.sender, to);
    }

    // ── Balance proof (threshold without revealing the amount) ───────────

    /**
     * @notice Prove your balance is >= an encrypted threshold. Stores an
     *         encrypted boolean only you can unseal.
     */
    function proveBalanceAtLeast(InEuint32 memory encThreshold) external {
        if (!hasAccount[msg.sender]) revert NoAccount();
        euint32 threshold = FHE.asEuint32(encThreshold);
        ebool ok = FHE.gte(balances[msg.sender], threshold);
        FHE.allowThis(ok);
        FHE.allow(ok, msg.sender);
        proofResult[msg.sender] = ok;
        proofReady[msg.sender] = true;
        emit BalanceProofReady(msg.sender);
    }

    function getBalanceProof() external view returns (ebool) {
        if (!proofReady[msg.sender]) revert ProofNotReady();
        return proofResult[msg.sender];
    }

    // ── Disclosure / views ───────────────────────────────────────────────

    /// @notice Encrypted handle of your balance (unseal off-chain with your permit).
    function getEncryptedBalance() external view returns (euint32) {
        return balances[msg.sender];
    }

    /// @notice Grant ONE viewer permission to unseal your balance.
    function grantBalanceAccess(address viewer) external {
        if (!hasAccount[msg.sender]) revert NoAccount();
        FHE.allow(balances[msg.sender], viewer);
        emit BalanceAccessGranted(msg.sender, viewer);
    }
}
