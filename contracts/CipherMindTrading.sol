// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CipherMindTrading
 * @notice FHE-enabled trading signal contract for CipherMind AI.
 * @dev Users submit encrypted trading parameters (position size, entry price,
 *      stop loss, take profit) and the oracle processes them through Nous
 *      Hermes AI to return encrypted signals (direction, strength, risk level).
 */
contract CipherMindTrading is Ownable {
    // Signal direction constants (stored as uint32 for FHE compat)
    // 0 = HOLD, 1 = BUY, 2 = SELL
    uint32 public constant SIGNAL_HOLD = 0;
    uint32 public constant SIGNAL_BUY  = 1;
    uint32 public constant SIGNAL_SELL = 2;

    // ── Encrypted user data ──────────────────────────────────────────────
    struct EncryptedPosition {
        euint32 positionSize;    // Position size in USD (encrypted)
        euint32 entryPrice;      // Entry price × 100 (encrypted)
        euint32 stopLoss;        // Stop loss × 100 (encrypted)
        euint32 takeProfit;      // Take profit × 100 (encrypted)
        euint32 riskTolerance;   // 1-10 scale (encrypted)
        string  asset;           // Asset symbol (public, needed for AI inference)
        bool    submitted;
        uint256 timestamp;
    }

    // ── Encrypted results ────────────────────────────────────────────────
    struct TradingSignal {
        euint32 direction;       // 0=HOLD, 1=BUY, 2=SELL (encrypted)
        euint32 strength;        // Signal strength 0-100 (encrypted)
        euint32 riskLevel;       // Risk assessment 0-100 (encrypted)
        euint32 suggestedEntry;  // Suggested entry price × 100 (encrypted)
        bool    fulfilled;
        uint256 timestamp;
    }

    // ── State ────────────────────────────────────────────────────────────
    mapping(address => EncryptedPosition[]) public positionHistory;
    mapping(address => TradingSignal)       public latestSignal;
    mapping(address => uint256)             public signalCount;

    address public oracle;
    uint256 public totalRequests;

    // ── Events ───────────────────────────────────────────────────────────
    event SignalRequested(address indexed user, string asset, uint256 requestId);
    event SignalFulfilled(address indexed user, uint256 requestId);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotOracle();
    error NoPositionSubmitted();
    error SignalNotReady();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    // ── User-facing ──────────────────────────────────────────────────────

    /**
     * @notice Submit encrypted trading parameters for signal generation.
     * @param _positionSize  Encrypted position size in USD
     * @param _entryPrice    Encrypted entry price × 100
     * @param _stopLoss      Encrypted stop loss price × 100
     * @param _takeProfit    Encrypted take profit price × 100
     * @param _riskTolerance Encrypted risk tolerance (1-10)
     * @param _asset         Asset symbol (e.g., "ETH", "BTC")
     */
    function submitPosition(
        InEuint32 memory _positionSize,
        InEuint32 memory _entryPrice,
        InEuint32 memory _stopLoss,
        InEuint32 memory _takeProfit,
        InEuint32 memory _riskTolerance,
        string calldata _asset
    ) external {
        euint32 positionSize  = FHE.asEuint32(_positionSize);
        euint32 entryPrice    = FHE.asEuint32(_entryPrice);
        euint32 stopLoss      = FHE.asEuint32(_stopLoss);
        euint32 takeProfit    = FHE.asEuint32(_takeProfit);
        euint32 riskTolerance = FHE.asEuint32(_riskTolerance);

        // Allow this contract to operate on the ciphertexts
        FHE.allowThis(positionSize);
        FHE.allowThis(entryPrice);
        FHE.allowThis(stopLoss);
        FHE.allowThis(takeProfit);
        FHE.allowThis(riskTolerance);

        // Allow the sender to view their data
        FHE.allowSender(positionSize);
        FHE.allowSender(entryPrice);
        FHE.allowSender(stopLoss);
        FHE.allowSender(takeProfit);
        FHE.allowSender(riskTolerance);

        positionHistory[msg.sender].push(EncryptedPosition({
            positionSize:  positionSize,
            entryPrice:    entryPrice,
            stopLoss:      stopLoss,
            takeProfit:    takeProfit,
            riskTolerance: riskTolerance,
            asset:         _asset,
            submitted:     true,
            timestamp:     block.timestamp
        }));

        totalRequests++;
        signalCount[msg.sender]++;

        emit SignalRequested(msg.sender, _asset, totalRequests);
    }

    // ── Oracle-facing ────────────────────────────────────────────────────

    /**
     * @notice Oracle fulfills a trading signal request with encrypted results.
     * @param _user           Address of the user whose signal is being fulfilled
     * @param _direction      Encrypted direction (0=HOLD, 1=BUY, 2=SELL)
     * @param _strength       Encrypted signal strength (0-100)
     * @param _riskLevel      Encrypted risk assessment (0-100)
     * @param _suggestedEntry Encrypted suggested entry price × 100
     */
    function fulfillSignal(
        address _user,
        InEuint32 memory _direction,
        InEuint32 memory _strength,
        InEuint32 memory _riskLevel,
        InEuint32 memory _suggestedEntry
    ) external onlyOracle {
        if (signalCount[_user] == 0) revert NoPositionSubmitted();

        euint32 direction      = FHE.asEuint32(_direction);
        euint32 strength       = FHE.asEuint32(_strength);
        euint32 riskLevel      = FHE.asEuint32(_riskLevel);
        euint32 suggestedEntry = FHE.asEuint32(_suggestedEntry);

        FHE.allowThis(direction);
        FHE.allowThis(strength);
        FHE.allowThis(riskLevel);
        FHE.allowThis(suggestedEntry);

        FHE.allow(direction, _user);
        FHE.allow(strength, _user);
        FHE.allow(riskLevel, _user);
        FHE.allow(suggestedEntry, _user);

        latestSignal[_user] = TradingSignal({
            direction:      direction,
            strength:       strength,
            riskLevel:      riskLevel,
            suggestedEntry: suggestedEntry,
            fulfilled:      true,
            timestamp:      block.timestamp
        });

        emit SignalFulfilled(_user, totalRequests);
    }

    // ── View functions ───────────────────────────────────────────────────

    /**
     * @notice Allow public decryption of a user's trading signal.
     */
    function allowSignalPublicly() external {
        if (!latestSignal[msg.sender].fulfilled) revert SignalNotReady();
        FHE.allowPublic(latestSignal[msg.sender].direction);
        FHE.allowPublic(latestSignal[msg.sender].strength);
        FHE.allowPublic(latestSignal[msg.sender].riskLevel);
        FHE.allowPublic(latestSignal[msg.sender].suggestedEntry);
    }

    /**
     * @notice Publish the decrypted trading signal on-chain (3-step flow, step 3).
     */
    function revealSignal(
        uint32 dirPlaintext, bytes memory dirSig,
        uint32 strPlaintext, bytes memory strSig,
        uint32 riskPlaintext, bytes memory riskSig,
        uint32 entryPlaintext, bytes memory entrySig
    ) external {
        TradingSignal storage sig = latestSignal[msg.sender];
        if (!sig.fulfilled) revert SignalNotReady();

        FHE.publishDecryptResult(sig.direction, dirPlaintext, dirSig);
        FHE.publishDecryptResult(sig.strength, strPlaintext, strSig);
        FHE.publishDecryptResult(sig.riskLevel, riskPlaintext, riskSig);
        FHE.publishDecryptResult(sig.suggestedEntry, entryPlaintext, entrySig);
    }

    /**
     * @notice Get the user's position history length.
     */
    function getPositionCount(address _user) external view returns (uint256) {
        return positionHistory[_user].length;
    }

    // ── Admin ────────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
