//logController.js
const fs = require("fs");
const path = require("path");

exports.getLogs = (req, res) => {
  const logFile = path.join(__dirname, "../data/logs.json");

  let logs = [];

  try {
    logs = JSON.parse(fs.readFileSync(logFile));
  } catch (err) {
    logs = [];
  }

  res.json(logs);
};