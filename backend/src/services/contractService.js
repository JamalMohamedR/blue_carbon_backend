const { contract } = require("../config/contract");
const ethers = require("ethers");

async function mintCredit(toAddress, projectId, location, verificationId) {
  // call smart contract issueCredit (server signer must have ISSUER_ROLE)
  const gasLimit = 500000; // tune if needed
  const tx = await contract.issueCredit(toAddress, projectId, location, verificationId, { gasLimit });
  const receipt = await tx.wait();
  
  // find CreditIssued event in receipt (ethers.js v6 format)
  let tokenId = null;
  if (receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "CreditIssued") {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (err) {
        // Skip logs that don't match our contract
        continue;
      }
    }
  }
  
  return { txHash: receipt.hash, tokenId };
}

async function getCreditOnChain(tokenId) {
  const c = await contract.credits(tokenId);
  // c is a tuple: (projectId, location, verificationId, issuedAt, retired)
  return {
    projectId: c[0],
    location: c[1],
    verificationId: c[2],
    issuedAt: Number(c[3]),
    retired: c[4]
  };
}

// retire: note this must be called by owner or admin. Server signer must be owner or admin
async function retire(tokenId) {
  const tx = await contract.retire(tokenId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

module.exports = {
  mintCredit,
  getCreditOnChain,
  retire
};
