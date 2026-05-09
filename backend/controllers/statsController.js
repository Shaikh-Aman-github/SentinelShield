//statsController.js
const fs = require("fs");
const path = require("path");

exports.getStats = (req, res) => {
  const logFile = path.join(__dirname, "../data/logs.json");

  let logs = [];

  try {
    logs = JSON.parse(fs.readFileSync(logFile));
  } catch {
    logs = [];
  }

  // Count attack types
  const stats = {
    total: logs.length,
    sql: logs.filter(l => l.type === "SQL Injection").length,
    xss: logs.filter(l => l.type === "XSS").length,
    lfi: logs.filter(l => l.type === "LFI").length,
    cmd: logs.filter(l => l.type === "Command Injection").length,
    dir: logs.filter(l => l.type === "Directory Traversal").length,
    rate: logs.filter(l => l.type === "Rate Limit").length,
    Other: logs.filter(l => l.type === "Suspicious Header Activity").length
  };

  const statusCount = {
    Normal: 0,
    Suspicious: 0,
    Malicious: 0
  };

  // 🔥 Top attacker IPs
  const ipMap = {};

  logs.forEach(log => {
    ipMap[log.ip] = (ipMap[log.ip] || 0) + 1;

    if (log.reputation) {
      statusCount[log.reputation.level]++;
    } else {
      statusCount["Normal"]++;
    }
  });

  const topIPs = Object.entries(ipMap)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 🔥 Recent logs (last 5)
  const recent = logs.slice(-5).reverse();

  res.json({
    ...stats,
    topIPs,
    recent,
    statusCount
  });
};