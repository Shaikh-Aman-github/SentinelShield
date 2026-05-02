const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../data/logs.json");

const getSeverity = (type) => {
  switch (type) {
    case "SQL Injection":
    case "Command Injection":
      return "CRITICAL";

    case "XSS":
    case "LFI":
      return "HIGH";

    case "Directory Traversal":
      return "MEDIUM";

    case "Rate Limit":
      return "LOW";

    default:
      return "UNKNOWN";
  }
};

module.exports = (reqIp, type, url, method = "GET") => {
  let logs = [];

  try {
    logs = JSON.parse(fs.readFileSync(logFile));
  } catch {
    logs = [];
  }

  const currentTime = new Date().toISOString();
  const now = Date.now();

  // 🔥 Special handling for Rate Limit
  if (type === "Rate Limit") {
    const existingLog = logs.find((log) => {
      if (
        log.type !== "Rate Limit" ||
        log.ip !== reqIp ||
        log.status === "Resolved"
      ) {
        return false;
      }

      const lastTime = new Date(log.lastTriggered).getTime();

      // same session if within 2 minutes
      return now - lastTime < 2 * 60 * 1000;
    });

    // Existing session → update current log
    if (existingLog) {
      existingLog.count = (existingLog.count || 1) + 1;
      existingLog.lastTriggered = currentTime;
      existingLog.url = url;

      // add details
      if (!existingLog.details) {
        existingLog.details = [];
      }

      existingLog.details.push({
        time: currentTime,
        url,
        method,
        message: "Rate limit exceeded for repeated requests"
      });

      // add history
      if (!existingLog.history) {
        existingLog.history = [];
      }

      existingLog.history.push({
        attemptTime: currentTime,
        url,
        method,
        message: "Repeated attacker behavior detected"
      });

      // 🔥 Suspicious logic
      if (existingLog.history.length > 3) {
        existingLog.ipStatus = "Suspicious";
      } else {
        existingLog.ipStatus = "Normal";
      }

      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      return;
    }

    // First rate-limit session entry
    const newRateLimitLog = {
      time: currentTime,
      ip: reqIp,
      ipStatus: "Normal",

      type,
      url,
      severity: getSeverity(type),

      count: 1,
      lastTriggered: currentTime,
      status: "Active",

      details: [
        {
          time: currentTime,
          url,
          method,
          message: "Rate limit exceeded for repeated requests"
        }
      ],

      history: [
        {
          attemptTime: currentTime,
          url,
          method,
          message: "Repeated attacker behavior detected"
        }
      ]
    };

    logs.push(newRateLimitLog);

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    return;
  }

  // Normal attacks → always new entry
  const newLog = {
    time: currentTime,
    ip: reqIp,
    ipStatus: "Normal",

    type,
    url,
    severity: getSeverity(type),

    count: 1,
    lastTriggered: currentTime,
    status: "Active"
  };

  logs.push(newLog);

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
};