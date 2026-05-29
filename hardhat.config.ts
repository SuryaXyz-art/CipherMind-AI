import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@cofhe/hardhat-plugin";
import * as dotenv from "dotenv";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  cofhe: {
    logMocks: true,
    gasWarning: true,
  },
  solidity: {
    version: "0.8.25",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    // localcofhe, eth-sepolia, and arb-sepolia are auto-injected by @cofhe/hardhat-plugin

    // Arbitrum Sepolia (primary deployment target)
    // Note: arb-sepolia is auto-injected but we can override settings here
    "arb-sepolia-custom": {
      url: process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      gasMultiplier: 1.2,
      timeout: 60000,
    },

    // Base Sepolia testnet configuration (not provided by plugin)
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasMultiplier: 1.2,
      timeout: 60000,
      httpHeaders: {},
    },
  },

  etherscan: {
    // Etherscan V2 unified API: a single key is routed by chainId across all
    // chains (incl. Arbitrum Sepolia 421614). hardhat-verify >= 2.1 uses V2.
    apiKey: process.env.ARBISCAN_API_KEY || "",
  },
};

export default config;
