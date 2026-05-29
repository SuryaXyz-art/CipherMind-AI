// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CipherMindCredit
 * @notice FHE-enabled credit scoring contract for CipherMind AI.
 * @dev Users submit encrypted financial features (income, debt, history length, etc.)
 *      which are processed entirely under FHE. An off-chain oracle (listening to events)
 *      calls Nous Hermes AI on anonymized feature bands and writes the encrypted
 *      credit score back on-chain.
 */
contract CipherMindCredit is Ownable {
    // ── Encrypted user data ──────────────────────────────────────────────
    struct EncryptedProfile {
        euint32 income;          // Annual income (encrypted)
        euint32 debtRatio;       // Debt-to-income ratio × 100 (encrypted)
        euint32 historyMonths;   // Credit history length in months (encrypted)
        euint32 openAccounts;    // Number of open accounts (encrypted)
        bool    submitted;
    }

    // ── Encrypted results ────────────────────────────────────────────────
    struct CreditResult {
        euint32 score;           // 300-850 range (encrypted)
        euint32 confidence;      // 0-100 confidence level (encrypted)
        bool    fulfilled;
    }

    // ── State ────────────────────────────────────────────────────────────
    mapping(address => EncryptedProfile) public profiles;
    mapping(address => CreditResult)     public results;
    mapping(address => uint256)          public requestTimestamps;

    address public oracle;
    uint256 public requestCount;

    // ── Confidential benchmarking ────────────────────────────────────────
    // The running sum of every user's score stays encrypted; only the public
    // count is visible. A user can learn whether they're above the network
    // average without anyone's individual score (or the average) being revealed.
    euint32 private encryptedScoreSum;
    uint256 public  benchmarkCount;
    mapping(address => bool)  public countedInBenchmark;
    mapping(address => ebool) private aboveAverage;
    mapping(address => bool)  public benchmarkReady;

    // ── Encrypted threshold alerts ───────────────────────────────────────
    // "Is my score ≥ X?" answered as an encrypted boolean — X and the score
    // both stay private; only the caller can unseal the yes/no.
    mapping(address => ebool) private thresholdResult;
    mapping(address => bool)  public thresholdReady;

    // ── FHE constants ────────────────────────────────────────────────────
    euint32 public SCORE_FLOOR;     // 300
    euint32 public SCORE_CEILING;   // 850

    // ── Events ───────────────────────────────────────────────────────────
    event CreditRequested(address indexed user, uint256 requestId);
    event CreditFulfilled(address indexed user, uint256 requestId);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event BenchmarkComputed(address indexed user);
    event ThresholdEvaluated(address indexed user);
    event ScoreAccessGranted(address indexed owner, address indexed viewer);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotOracle();
    error ProfileNotSubmitted();
    error ResultNotReady();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;

        SCORE_FLOOR   = FHE.asEuint32(300);
        SCORE_CEILING = FHE.asEuint32(850);

        FHE.allowThis(SCORE_FLOOR);
        FHE.allowThis(SCORE_CEILING);
    }

    // ── User-facing ──────────────────────────────────────────────────────

    /**
     * @notice Submit encrypted financial profile for credit scoring.
     * @param _income        Encrypted annual income
     * @param _debtRatio     Encrypted debt-to-income ratio × 100
     * @param _historyMonths Encrypted credit history months
     * @param _openAccounts  Encrypted open account count
     */
    function submitProfile(
        InEuint32 memory _income,
        InEuint32 memory _debtRatio,
        InEuint32 memory _historyMonths,
        InEuint32 memory _openAccounts
    ) external {
        euint32 income        = FHE.asEuint32(_income);
        euint32 debtRatio     = FHE.asEuint32(_debtRatio);
        euint32 historyMonths = FHE.asEuint32(_historyMonths);
        euint32 openAccounts  = FHE.asEuint32(_openAccounts);

        // Allow this contract to operate on the ciphertexts
        FHE.allowThis(income);
        FHE.allowThis(debtRatio);
        FHE.allowThis(historyMonths);
        FHE.allowThis(openAccounts);

        // Allow the sender to view their data
        FHE.allowSender(income);
        FHE.allowSender(debtRatio);
        FHE.allowSender(historyMonths);
        FHE.allowSender(openAccounts);

        // Allow the off-chain oracle to decrypt these features so it can
        // anonymize them into bands before calling the AI. Without this grant
        // the oracle has no permit to read the ciphertexts off-chain.
        FHE.allow(income, oracle);
        FHE.allow(debtRatio, oracle);
        FHE.allow(historyMonths, oracle);
        FHE.allow(openAccounts, oracle);

        profiles[msg.sender] = EncryptedProfile({
            income:        income,
            debtRatio:     debtRatio,
            historyMonths: historyMonths,
            openAccounts:  openAccounts,
            submitted:     true
        });

        requestTimestamps[msg.sender] = block.timestamp;
        requestCount++;

        emit CreditRequested(msg.sender, requestCount);
    }

    // ── Oracle-facing ────────────────────────────────────────────────────

    /**
     * @notice Oracle fulfills a credit score request with encrypted results.
     * @param _user       Address of the user whose score is being fulfilled
     * @param _score      Encrypted credit score (300-850)
     * @param _confidence Encrypted confidence level (0-100)
     */
    function fulfillCreditScore(
        address _user,
        InEuint32 memory _score,
        InEuint32 memory _confidence
    ) external onlyOracle {
        if (!profiles[_user].submitted) revert ProfileNotSubmitted();

        euint32 score      = FHE.asEuint32(_score);
        euint32 confidence = FHE.asEuint32(_confidence);

        // Clamp score between floor and ceiling
        // score = max(SCORE_FLOOR, min(score, SCORE_CEILING))
        ebool tooLow  = FHE.lt(score, SCORE_FLOOR);
        score = FHE.select(tooLow, SCORE_FLOOR, score);

        ebool tooHigh = FHE.gt(score, SCORE_CEILING);
        score = FHE.select(tooHigh, SCORE_CEILING, score);

        FHE.allowThis(score);
        FHE.allowThis(confidence);
        FHE.allow(score, _user);
        FHE.allow(confidence, _user);

        results[_user] = CreditResult({
            score:      score,
            confidence: confidence,
            fulfilled:  true
        });

        // Contribute to the confidential benchmark exactly once per user so the
        // encrypted running average reflects the population, not repeat runs.
        if (!countedInBenchmark[_user]) {
            encryptedScoreSum = benchmarkCount == 0 ? score : FHE.add(encryptedScoreSum, score);
            FHE.allowThis(encryptedScoreSum);
            countedInBenchmark[_user] = true;
            benchmarkCount++;
        }

        emit CreditFulfilled(_user, requestCount);
    }

    // ── View functions ───────────────────────────────────────────────────

    /**
     * @notice Allow public decryption of a user's credit score (user calls this).
     */
    function allowScorePublicly() external {
        if (!results[msg.sender].fulfilled) revert ResultNotReady();
        FHE.allowPublic(results[msg.sender].score);
        FHE.allowPublic(results[msg.sender].confidence);
    }

    /**
     * @notice Publish the decrypted credit score on-chain (3-step flow, step 3).
     */
    function revealScore(
        uint32 scorePlaintext,
        bytes memory scoreSignature,
        uint32 confidencePlaintext,
        bytes memory confidenceSignature
    ) external {
        if (!results[msg.sender].fulfilled) revert ResultNotReady();
        FHE.publishDecryptResult(results[msg.sender].score, scorePlaintext, scoreSignature);
        FHE.publishDecryptResult(results[msg.sender].confidence, confidencePlaintext, confidenceSignature);
    }

    /**
     * @notice Get the decrypted credit score (only available after revealScore).
     */
    function getDecryptedScore() external view returns (uint256 score, uint256 confidence) {
        (uint256 s, bool sDecrypted) = FHE.getDecryptResultSafe(results[msg.sender].score);
        (uint256 c, bool cDecrypted) = FHE.getDecryptResultSafe(results[msg.sender].confidence);

        if (!sDecrypted || !cDecrypted) revert ResultNotReady();

        return (s, c);
    }

    // ── Confidential benchmarking ──────────────────────────────────────────

    /**
     * @notice Learn whether your score is above the encrypted network average —
     *         without revealing your score, anyone else's, or the average itself.
     * @dev Compares score * count > sum  ⇔  score > sum/count, avoiding FHE
     *      division. Stores an encrypted boolean only the caller can unseal.
     */
    function requestBenchmarkComparison() external {
        if (!results[msg.sender].fulfilled) revert ResultNotReady();
        if (benchmarkCount == 0) revert ResultNotReady();

        euint32 scaledScore = FHE.mul(
            results[msg.sender].score,
            FHE.asEuint32(uint32(benchmarkCount))
        );
        ebool above = FHE.gt(scaledScore, encryptedScoreSum);

        FHE.allowThis(above);
        FHE.allow(above, msg.sender);

        aboveAverage[msg.sender] = above;
        benchmarkReady[msg.sender] = true;
        emit BenchmarkComputed(msg.sender);
    }

    /// @notice Encrypted handle of your "above average?" result (unseal off-chain).
    function getBenchmarkResult() external view returns (ebool) {
        if (!benchmarkReady[msg.sender]) revert ResultNotReady();
        return aboveAverage[msg.sender];
    }

    // ── Encrypted threshold alerts ─────────────────────────────────────────

    /**
     * @notice Privately check whether your score ≥ an encrypted threshold you
     *         supply. Both the threshold and the score stay encrypted; the answer
     *         is an encrypted boolean only you can unseal.
     */
    function evaluateScoreThreshold(InEuint32 memory _threshold) external {
        if (!results[msg.sender].fulfilled) revert ResultNotReady();

        euint32 threshold = FHE.asEuint32(_threshold);
        ebool meets = FHE.gte(results[msg.sender].score, threshold);

        FHE.allowThis(meets);
        FHE.allow(meets, msg.sender);

        thresholdResult[msg.sender] = meets;
        thresholdReady[msg.sender] = true;
        emit ThresholdEvaluated(msg.sender);
    }

    /// @notice Encrypted handle of your threshold check (unseal off-chain).
    function getThresholdResult() external view returns (ebool) {
        if (!thresholdReady[msg.sender]) revert ResultNotReady();
        return thresholdResult[msg.sender];
    }

    // ── Selective-disclosure credit passport ───────────────────────────────

    /**
     * @notice Grant ONE specific viewer (e.g., a lender) permission to decrypt
     *         your score and confidence. The data stays encrypted on-chain; the
     *         viewer unseals it off-chain with their own permit. Composable —
     *         the viewer can be another contract gating logic on a private score.
     */
    function grantScoreAccess(address viewer) external {
        if (!results[msg.sender].fulfilled) revert ResultNotReady();
        FHE.allow(results[msg.sender].score, viewer);
        FHE.allow(results[msg.sender].confidence, viewer);
        emit ScoreAccessGranted(msg.sender, viewer);
    }

    // ── Admin ────────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
