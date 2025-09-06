const { mintCredit, getCreditOnChain, retire } = require("../services/contractService");
const CreditModel = require("../models/CreditModel");

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin-secret";

async function mintHandler(req, res) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== ADMIN_API_KEY) return res.status(403).json({ error: "forbidden" });

    const { toAddress, projectId, location, verificationId } = req.body;
    if (!toAddress || !projectId || !verificationId) {
      return res.status(400).json({ error: "missing fields" });
    }
    const { txHash, tokenId } = await mintCredit(toAddress, projectId, location || "", verificationId);

    // optionally upsert into DB
    await CreditModel.findOneAndUpdate(
      { tokenId },
      { tokenId, owner: toAddress, projectId, location, verificationId, issuedAt: Date.now(), txHash },
      { upsert: true }
    );

    return res.json({ success: true, tokenId, txHash });
  } catch (err) {
    console.error("mintHandler error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

async function getCreditHandler(req, res) {
  try {
    const tokenId = req.params.tokenId;
    const onchain = await getCreditOnChain(tokenId);
    const offchain = await CreditModel.findOne({ tokenId });
    return res.json({ tokenId, onchain, offchain });
  } catch (err) {
    console.error("getCreditHandler", err);
    return res.status(500).json({ error: err.message });
  }
}

async function retireHandler(req, res) {
  try {
    const apiKey = req.headers["x-api-key"];
    // This endpoint performs retire via server signer; requires API key and the server signer have rights.
    if (apiKey !== ADMIN_API_KEY) return res.status(403).json({ error: "forbidden" });

    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ error: "tokenId required" });

    const { txHash } = await retire(tokenId);
    // DB update will also be handled by event listener; but update optimistic:
    await CreditModel.findOneAndUpdate({ tokenId }, { retired: true, retireTxHash: txHash });
    return res.json({ success: true, txHash });
  } catch (err) {
    console.error("retireHandler", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { mintHandler, getCreditHandler, retireHandler };
