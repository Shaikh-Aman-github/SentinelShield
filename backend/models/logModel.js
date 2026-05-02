const fs = require("fs");

exports.readLogs = () => {
  return JSON.parse(fs.readFileSync("./backend/data/logs.json"));
};