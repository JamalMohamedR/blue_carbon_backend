// backend/src/config/contract.js
const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config();

// Load ABI
const abiPath = path.join(__dirname, "..", "..", "abis", "BlueCarbonRegistry.json");
const { abi } = require(abiPath);

// Validate environment variables
if (!process.env.SEPOLIA_RPC_URL) {
  throw new Error("SEPOLIA_RPC_URL is required");
}
if (!process.env.SERVER_PRIVATE_KEY) {
  throw new Error("SERVER_PRIVATE_KEY is required");
}
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is required");
}

// Validate contract address format
if (!ethers.isAddress(process.env.CONTRACT_ADDRESS)) {
  throw new Error(`Invalid contract address: ${process.env.CONTRACT_ADDRESS}`);
}

console.log("Initializing blockchain connection...");
console.log("Contract address:", process.env.CONTRACT_ADDRESS);

// Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);

// Contract instance
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Test connection function
async function testConnection() {
  try {
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    console.log("✅ Blockchain connection test successful:");
    console.log(`  Network: ${network.name} (${network.chainId})`);
    console.log(`  Wallet: ${wallet.address}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`  Current block: ${blockNumber}`);
    
    return true;
  } catch (error) {
    console.error("❌ Blockchain connection test failed:", error);
    return false;
  }
}

module.exports = { 
  provider, 
  wallet, 
  contract, 
  abi, 
  testConnection 
};