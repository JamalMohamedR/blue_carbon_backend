const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  name: String,
  description: String,
  lat: Number,
  lon: Number,
  createdBy: String
}, { timestamps: true });

module.exports = mongoose.model("Project", ProjectSchema);
