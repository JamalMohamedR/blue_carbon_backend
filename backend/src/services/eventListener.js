const { contract, provider } = require("../config/contract");
const CreditModel = require("../models/CreditModel");

async function initEventListeners() {
  console.log("Setting up contract event listeners...");
  
  try {
    // Validate contract setup
    const contractAddress = contract.target;
    console.log("Contract address:", contractAddress);
    
    if (!contractAddress || contractAddress.length !== 42) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    // Test contract connection
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    console.log(`Current block: ${blockNumber}`);

    // Remove any existing listeners first
    contract.removeAllListeners();

    // Setup CreditIssued event listener
    contract.on("CreditIssued", async (tokenId, to, projectId, location, verificationId, event) => {
      try {
        console.log("📌 CreditIssued Event Received:", {
          tokenId: tokenId.toString(),
          to,
          projectId: projectId.toString(),
          location,
          verificationId: verificationId.toString(),
          blockNumber: event.log.blockNumber,
          txHash: event.log.transactionHash
        });

        // Save to database
        const creditData = {
          tokenId: tokenId.toString(),
          owner: to,
          projectId: projectId.toString(),
          location,
          verificationId: verificationId.toString(),
          issuedAt: Math.floor(Date.now() / 1000),
          retired: false,
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber
        };

        await CreditModel.findOneAndUpdate(
          { tokenId: tokenId.toString() },
          creditData,
          { upsert: true, new: true }
        );

        console.log("✅ CreditIssued event saved to database");

      } catch (error) {
        console.error("❌ Error processing CreditIssued event:", error);
      }
    });

    // Setup CreditRetired event listener
    contract.on("CreditRetired", async (tokenId, retiredBy, event) => {
      try {
        console.log("📌 CreditRetired Event Received:", {
          tokenId: tokenId.toString(),
          retiredBy,
          blockNumber: event.log.blockNumber,
          txHash: event.log.transactionHash
        });

        // Update database
        const result = await CreditModel.findOneAndUpdate(
          { tokenId: tokenId.toString() },
          {
            retired: true,
            retiredBy,
            retiredAt: Math.floor(Date.now() / 1000),
            retireTxHash: event.log.transactionHash,
          },
          { new: true }
        );

        if (result) {
          console.log("✅ CreditRetired event saved to database");
        } else {
          console.warn("⚠️ No matching credit found for retirement");
        }

      } catch (error) {
        console.error("❌ Error processing CreditRetired event:", error);
      }
    });

    // Listen for any errors
    contract.on("error", (error) => {
      console.error("❌ Contract error:", error);
    });

    provider.on("error", (error) => {
      console.error("❌ Provider error:", error);
    });

    console.log("✅ Event listeners registered successfully");

  } catch (error) {
    console.error("❌ Failed to initialize event listeners:", error);
    throw error; // Re-throw to be handled by caller
  }
}

// Function to sync past events (useful for initial setup)
async function syncPastEvents(fromBlock = null) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const startBlock = fromBlock || Math.max(0, currentBlock - 10000); // Last 10k blocks if not specified

    console.log(`Syncing events from block ${startBlock} to ${currentBlock}`);

    // Get past CreditIssued events
    const creditIssuedEvents = await contract.queryFilter("CreditIssued", startBlock, currentBlock);
    console.log(`Found ${creditIssuedEvents.length} CreditIssued events`);

    for (const event of creditIssuedEvents) {
      const { tokenId, to, projectId, location, verificationId } = event.args;
      
      await CreditModel.findOneAndUpdate(
        { tokenId: tokenId.toString() },
        {
          tokenId: tokenId.toString(),
          owner: to,
          projectId: projectId.toString(),
          location,
          verificationId: verificationId.toString(),
          issuedAt: Math.floor(Date.now() / 1000),
          retired: false,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        },
        { upsert: true, new: true }
      );
    }

    // Get past CreditRetired events
    const creditRetiredEvents = await contract.queryFilter("CreditRetired", startBlock, currentBlock);
    console.log(`Found ${creditRetiredEvents.length} CreditRetired events`);

    for (const event of creditRetiredEvents) {
      const { tokenId, retiredBy } = event.args;
      
      await CreditModel.findOneAndUpdate(
        { tokenId: tokenId.toString() },
        {
          retired: true,
          retiredBy,
          retiredAt: Math.floor(Date.now() / 1000),
          retireTxHash: event.transactionHash,
        },
        { new: true }
      );
    }

    console.log(`✅ Synced ${creditIssuedEvents.length + creditRetiredEvents.length} past events`);

  } catch (error) {
    console.error("❌ Error syncing past events:", error);
  }
}

module.exports = {
  initEventListeners,
  syncPastEvents
};