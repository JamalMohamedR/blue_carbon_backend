const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const CONTRACT = process.env.CONTRACT_ADDRESS; // set after deploy
  const ISSUER_ADDR = process.env.ISSUER_ADDRESS; // the address to grant
  if (!CONTRACT || !ISSUER_ADDR) {
    console.error("Set CONTRACT_ADDRESS and ISSUER_ADDRESS in .env");
    process.exit(1);
  }
  const BlueCarbon = await hre.ethers.getContractFactory("BlueCarbonRegistry");
  const bc = BlueCarbon.attach(CONTRACT);
  const ISSUER_ROLE = hre.ethers.id("ISSUER_ROLE");
  const tx = await bc.grantRole(ISSUER_ROLE, ISSUER_ADDR);
  await tx.wait();
  console.log("Granted ISSUER_ROLE to", ISSUER_ADDR);
}

main().catch(e => { console.error(e); process.exit(1); });
