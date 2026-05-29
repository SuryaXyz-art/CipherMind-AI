/**
 * CipherMind AI — Oracle entrypoint (moved)
 *
 * The oracle now runs as a Hardhat task so it can reuse the project's CoFHE
 * client setup (mock batteries on localcofhe, real permits on Arbitrum Sepolia)
 * from tasks/utils.ts. The real privacy loop lives in backend/oracleLogic.ts.
 *
 * Run it with:
 *
 *   npx hardhat oracle --network localcofhe     # against local mocks
 *   npx hardhat oracle --network arb-sepolia     # against the live testnet
 *
 * Contract addresses come from CREDIT_CONTRACT_ADDRESS / TRADING_CONTRACT_ADDRESS
 * in .env, or from deployments/<network>.json written by the deploy tasks.
 */

console.log(
  "The CipherMind oracle now runs via Hardhat:\n" +
    "  npx hardhat oracle --network localcofhe\n" +
    "  npx hardhat oracle --network arb-sepolia\n\n" +
    "Core logic: backend/oracleLogic.ts — task wiring: tasks/oracle.ts",
);
