const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  owner: String,
  projectId: String,
  location: String,
  verificationId: String,
  issuedAt: Number,
  retired: { type: Boolean, default: false },
  txHash: String
}, { timestamps: true });

module.exports = mongoose.model("Credit", CreditSchema);
