require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Default private key for development - REPLACE WITH YOUR OWN FOR PRODUCTION
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default hardhat account

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Monad testnet configuration
    monadTestnet: {
      url: process.env.MONAD_TESTNET_URL || "https://testnet-rpc.monad.xyz",
      accounts: [PRIVATE_KEY],
      chainId: 10143,
      gasPrice: 50000000000, // 50 gwei - increased from 20 gwei
      gas: 6000000,  // 6 million gas limit 
      // Use maxPriorityFeePerGas to ensure transaction gets included without overpaying
      maxFeePerGas: 100000000000, // 100 gwei max fee - increased from 25 gwei
      maxPriorityFeePerGas: 5000000000, // 5 gwei priority fee - increased from 2 gwei
    },
    // Add hardhat network for local testing
    hardhat: {
      chainId: 31337
    },
  },
  paths: {
    sources: "./contracts", // Main contract directory
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test"
  }
};