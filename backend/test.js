// backend/test.js
const { ethers } = require("ethers");
const path = require("path");

// Load ABI JSON
const abiPath = path.join(__dirname, "abis", "BlueCarbonRegistry.json");
const { abi } = require(abiPath);

const iface = new ethers.Interface(abi);

// Print all events
for (const [name, frag] of Object.entries(iface.events)) {
  console.log(name, frag.format());
}
