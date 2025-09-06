import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

export default {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/Xx8W-aiyEV6bqP4zAzyvd",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      type: "http",
    },
  },
};