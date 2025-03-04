require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          // Enable the optimizer
          optimizer: {
            enabled: true,
            runs: 200,
          },
          // Enable the new IR pipeline
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    pulsechainTestnet: {
      url: process.env.PULSECHAIN_RPC, // e.g., "https://pulsechain-rpc.publicnode.com"
      chainId: Number(process.env.PULSECHAIN_CHAIN_ID) || 943,
      gas: Number(process.env.PULSECHAIN_GAS_LIMIT) || 30000000,
      accounts: process.env.PULSECHAIN_PRIVATE_KEY ? [process.env.PULSECHAIN_PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: {
      pulsechainTestnet: process.env.PULSECHAIN_API_KEY || "",
    },
    customChains: [
      {
        network: "pulsechainTestnet",
        chainId: 943,
        urls: {
          apiURL: "https://pulsechain-beacon-api.publicnode.com", // If different, adjust
          browserURL: "https://pulsechain-rpc.publicnode.com",       // If different, adjust
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};
