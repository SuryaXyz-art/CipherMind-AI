/** Minimal human-readable ABIs for the functions/events the frontend uses. */

export const CREDIT_ABI = [
  // user
  "function submitProfile((uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) income, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) debtRatio, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) historyMonths, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) openAccounts)",
  "function results(address) view returns (uint256 score, uint256 confidence, bool fulfilled)",
  // confidential features
  "function requestBenchmarkComparison()",
  "function getBenchmarkResult() view returns (uint256)",
  "function benchmarkCount() view returns (uint256)",
  "function evaluateScoreThreshold((uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) threshold)",
  "function getThresholdResult() view returns (uint256)",
  "function grantScoreAccess(address viewer)",
  // events
  "event CreditRequested(address indexed user, uint256 requestId)",
  "event CreditFulfilled(address indexed user, uint256 requestId)",
];

export const USDC_ABI = [
  "function faucet(uint256 amount)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const VAULT_ABI = [
  "function usdc() view returns (address)",
  "function hasAccount(address) view returns (bool)",
  "function deposit(uint256 amount)",
  "function send(address to, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) encAmount)",
  "function proveBalanceAtLeast((uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) encThreshold)",
  "function getBalanceProof() view returns (uint256)",
  "function getEncryptedBalance() view returns (uint256)",
  "function grantBalanceAccess(address viewer)",
  "event Deposited(address indexed user, uint256 amount)",
  "event PrivateTransfer(address indexed from, address indexed to)",
  "event BalanceProofReady(address indexed user)",
];

const IN_EUINT = "(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature)";

export const PAYROLL_ABI = [
  "function runCount() view returns (uint256)",
  "function runs(uint256) view returns (address employer, uint256 employeeCount, bool exists, string label)",
  "function createRun(string label) returns (uint256)",
  `function setAllocation(uint256 runId, address employee, ${IN_EUINT} amount)`,
  "function getAllocation(uint256 runId) view returns (uint256)",
  "function claim(uint256 runId)",
  "function isEmployee(uint256, address) view returns (bool)",
  "function claimed(uint256, address) view returns (bool)",
  "function getEncryptedSalary() view returns (uint256)",
  "function grantSalaryAccess(address viewer)",
  "event RunCreated(uint256 indexed runId, address indexed employer, string label)",
  "event Claimed(uint256 indexed runId, address indexed employee)",
];

export const LENDING_ABI = [
  "function hasPosition(address) view returns (bool)",
  "function depositCollateral(uint256 amount)",
  `function borrow(${IN_EUINT} encAmount)`,
  `function repay(${IN_EUINT} encAmount)`,
  "function checkHealth()",
  "function getEncryptedCollateral() view returns (uint256)",
  "function getEncryptedDebt() view returns (uint256)",
  "function getEncryptedBorrowable() view returns (uint256)",
  "function getHealth() view returns (uint256)",
  "event CollateralDeposited(address indexed user, uint256 amount)",
  "event Borrowed(address indexed user)",
];

export const TRADING_ABI = [
  "function submitPosition((uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) positionSize, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) entryPrice, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) stopLoss, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) takeProfit, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) riskTolerance, string asset)",
  "function latestSignal(address) view returns (uint256 direction, uint256 strength, uint256 riskLevel, uint256 suggestedEntry, bool fulfilled, uint256 timestamp)",
  // confidential features
  "function requestStrengthBenchmark()",
  "function getBenchmarkResult() view returns (uint256)",
  "function benchmarkCount() view returns (uint256)",
  "function evaluateRiskThreshold((uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) threshold)",
  "function getRiskThresholdResult() view returns (uint256)",
  "function grantSignalAccess(address viewer)",
  // events
  "event SignalRequested(address indexed user, string asset, uint256 requestId)",
  "event SignalFulfilled(address indexed user, uint256 requestId)",
];
