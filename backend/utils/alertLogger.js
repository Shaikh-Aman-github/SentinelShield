const fs = require("fs");
const path = require("path");

const alertFile = path.join(__dirname, "../data/alerts.json");

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

module.exports = (ip, type, url) => {
  let alerts = [];

  try {
    alerts = JSON.parse(fs.readFileSync(alertFile));
  } catch {
    alerts = [];
  }

  const currentTime = new Date().toISOString();

  // 🔥 Special handling for Rate Limit session-based logic
  if (type === "Rate Limit") {
    const existingAlert = alerts.find((alert) => {
      if (
        alert.type !== "Rate Limit" ||
        alert.ip !== ip ||
        alert.markAsRead !== "No"
      ) {
        return false;
      }

      const lastTime = new Date(alert.lastTriggered).getTime();
      const now = Date.now();

      // merge only if within 2 minutes
      return now - lastTime < 2 * 60 * 1000;
    });

    // existing session → update count only
    if (existingAlert) {
      existingAlert.count = (existingAlert.count || 1) + 1;
      existingAlert.lastTriggered = currentTime;
      existingAlert.url = url;

      fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
      return;
    }
  }

  // create NEW alert entry
  const newAlert = {
    time: currentTime,
    ip,
    type,
    url,
    severity: getSeverity(type),

    count: 1,
    lastTriggered: currentTime,

    markAsRead: "No",
    sendToAdmin: "No"
  };

  alerts.push(newAlert);

  fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
};