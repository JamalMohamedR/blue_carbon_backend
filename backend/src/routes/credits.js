const express = require("express");
const router = express.Router();
const { mintHandler, getCreditHandler, retireHandler } = require("../controllers/creditsController");

router.post("/mint", mintHandler);
router.get("/:tokenId", getCreditHandler);
router.post("/retire", retireHandler);

module.exports = router;
