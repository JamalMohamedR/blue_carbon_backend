require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const creditsRouter = require("./routes/credits");
const { initEventListeners } = require("./services/eventListener");

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB(process.env.MONGO_URI);

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  app.use("/api/credits", creditsRouter);

  app.get("/", (req, res) => res.send("Blue Carbon Blockchain Backend"));

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });

  // start event listeners (keeps DB synced)
  initEventListeners();
}

main().catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});
