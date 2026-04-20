// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CipherMindAnalytics
 * @notice Generic encrypted analytics contract for CipherMind AI.
 * @dev A flexible analytics engine that allows users to submit encrypted
 *      key-value feature sets and receive encrypted analytical results.
 *      Supports generic use cases beyond credit scoring and trading signals.
 */
contract CipherMindAnalytics is Ownable {
    // Maximum number of features per request
    uint256 public constant MAX_FEATURES = 8;

    // ── Encrypted analytics request ──────────────────────────────────────
    struct AnalyticsRequest {
        euint32[8] features;     // Up to 8 encrypted uint32 features
        uint256    featureCount; // Number of features actually used
        string     queryType;    // Type of analysis (e.g., "risk_assess", "anomaly_detect")
        bool       submitted;
        uint256    timestamp;
    }

    // ── Encrypted analytics result ───────────────────────────────────────
    struct AnalyticsResult {
        euint32 primaryScore;    // Primary analytical output (encrypted)
        euint32 secondaryScore;  // Secondary output, e.g. confidence (encrypted)
        euint32 category;        // Category/classification (encrypted)
        bool    fulfilled;
        uint256 timestamp;
    }

    // ── State ────────────────────────────────────────────────────────────
    mapping(address => mapping(uint256 => AnalyticsRequest)) public requests;
    mapping(address => mapping(uint256 => AnalyticsResult))  public analyticsResults;
    mapping(address => uint256) public requestCounts;

    address public oracle;
    uint256 public totalRequests;

    // Supported query types
    mapping(string => bool) public supportedQueryTypes;

    // ── Events ───────────────────────────────────────────────────────────
    event AnalyticsRequested(address indexed user, string queryType, uint256 requestId);
    event AnalyticsFulfilled(address indexed user, uint256 requestId);
    event QueryTypeAdded(string queryType);
    event QueryTypeRemoved(string queryType);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotOracle();
    error UnsupportedQueryType();
    error TooManyFeatures();
    error RequestNotFound();
    error ResultNotReady();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;

        // Register default query types
        supportedQueryTypes["risk_assessment"]  = true;
        supportedQueryTypes["anomaly_detection"] = true;
        supportedQueryTypes["sentiment_analysis"] = true;
        supportedQueryTypes["portfolio_optimization"] = true;
    }

    // ── User-facing ──────────────────────────────────────────────────────

    /**
     * @notice Submit encrypted features for analytics.
     * @param _features   Array of encrypted features (max 8)
     * @param _queryType  Type of analysis requested
     */
    function submitRequest(
        InEuint32[] memory _features,
        string calldata _queryType
    ) external {
        if (!supportedQueryTypes[_queryType]) revert UnsupportedQueryType();
        if (_features.length > MAX_FEATURES) revert TooManyFeatures();

        uint256 requestId = requestCounts[msg.sender];
        AnalyticsRequest storage req = requests[msg.sender][requestId];

        for (uint256 i = 0; i < _features.length; i++) {
            euint32 feature = FHE.asEuint32(_features[i]);
            FHE.allowThis(feature);
            FHE.allowSender(feature);
            req.features[i] = feature;
        }

        req.featureCount = _features.length;
        req.queryType    = _queryType;
        req.submitted    = true;
        req.timestamp    = block.timestamp;

        requestCounts[msg.sender]++;
        totalRequests++;

        emit AnalyticsRequested(msg.sender, _queryType, totalRequests);
    }

    // ── Oracle-facing ────────────────────────────────────────────────────

    /**
     * @notice Oracle fulfills an analytics request.
     * @param _user           User address
     * @param _requestId      Request ID for the user
     * @param _primaryScore   Encrypted primary score
     * @param _secondaryScore Encrypted secondary score
     * @param _category       Encrypted category/classification
     */
    function fulfillAnalytics(
        address _user,
        uint256 _requestId,
        InEuint32 memory _primaryScore,
        InEuint32 memory _secondaryScore,
        InEuint32 memory _category
    ) external onlyOracle {
        if (!requests[_user][_requestId].submitted) revert RequestNotFound();

        euint32 primaryScore   = FHE.asEuint32(_primaryScore);
        euint32 secondaryScore = FHE.asEuint32(_secondaryScore);
        euint32 category       = FHE.asEuint32(_category);

        FHE.allowThis(primaryScore);
        FHE.allowThis(secondaryScore);
        FHE.allowThis(category);

        FHE.allow(primaryScore, _user);
        FHE.allow(secondaryScore, _user);
        FHE.allow(category, _user);

        analyticsResults[_user][_requestId] = AnalyticsResult({
            primaryScore:   primaryScore,
            secondaryScore: secondaryScore,
            category:       category,
            fulfilled:      true,
            timestamp:      block.timestamp
        });

        emit AnalyticsFulfilled(_user, _requestId);
    }

    // ── View functions ───────────────────────────────────────────────────

    /**
     * @notice Allow public decryption of an analytics result.
     */
    function allowResultPublicly(uint256 _requestId) external {
        AnalyticsResult storage res = analyticsResults[msg.sender][_requestId];
        if (!res.fulfilled) revert ResultNotReady();
        FHE.allowPublic(res.primaryScore);
        FHE.allowPublic(res.secondaryScore);
        FHE.allowPublic(res.category);
    }

    /**
     * @notice Publish the decrypted analytics result on-chain.
     */
    function revealResult(
        uint256 _requestId,
        uint32 primaryPlaintext, bytes memory primarySig,
        uint32 secondaryPlaintext, bytes memory secondarySig,
        uint32 categoryPlaintext, bytes memory categorySig
    ) external {
        AnalyticsResult storage res = analyticsResults[msg.sender][_requestId];
        if (!res.fulfilled) revert ResultNotReady();

        FHE.publishDecryptResult(res.primaryScore, primaryPlaintext, primarySig);
        FHE.publishDecryptResult(res.secondaryScore, secondaryPlaintext, secondarySig);
        FHE.publishDecryptResult(res.category, categoryPlaintext, categorySig);
    }

    // ── Admin ────────────────────────────────────────────────────────────

    function addQueryType(string calldata _queryType) external onlyOwner {
        supportedQueryTypes[_queryType] = true;
        emit QueryTypeAdded(_queryType);
    }

    function removeQueryType(string calldata _queryType) external onlyOwner {
        supportedQueryTypes[_queryType] = false;
        emit QueryTypeRemoved(_queryType);
    }

    function setOracle(address _oracle) external onlyOwner {
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
