import { ethers } from "ethers";
import hre from "hardhat";
import "dotenv/config";

async function main() {
  // Debug environment variables
  console.log("Environment variables:");
  console.log("SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL ? "✅ Loaded" : "❌ Missing");
  console.log("DEPLOYER_PRIVATE_KEY:", process.env.DEPLOYER_PRIVATE_KEY ? "✅ Loaded" : "❌ Missing");
  
  // Get the network configuration
  const network = hre.config.networks.sepolia;
  console.log("Network config:", network);
  
  // Use environment variables directly instead of network config
  const url = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  console.log("Network URL:", url);
  console.log("Private key length:", privateKey ? privateKey.length : "undefined");
  
  if (!url || !privateKey) {
    throw new Error("Missing SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY in environment variables");
  }
  
  // Ensure private key has 0x prefix
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(formattedPrivateKey, provider);
  
  console.log("Wallet address:", await wallet.getAddress());
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.warn("⚠️ Warning: Wallet has 0 ETH. You need Sepolia testnet ETH to deploy.");
  }
  
  // Get the artifact
  const artifact = await hre.artifacts.readArtifact("BlueCarbonRegistry");
  
  // Create contract factory
  const BlueCarbonRegistry = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  
  // Deploy contract with constructor arguments
  console.log("Deploying BlueCarbonRegistry...");
  const contract = await BlueCarbonRegistry.deploy("Blue Carbon Registry", "BCR");
  
  // Wait until deployed
  await contract.waitForDeployment();
  
  console.log("✅ BlueCarbonRegistry deployed at:", await contract.getAddress());
}

// Run the script
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});