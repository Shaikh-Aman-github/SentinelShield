const fs = require("fs/promises");
const path = require("path");

const { safeWrite } = require("./fileLock");
const { getGeoData, getSourceType, getRiskScore, getFingerprint, getPayload } = require("./enrichData");

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

module.exports = async (req, type) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "unknown";
  const url = req.originalUrl;

  let alerts = [];

  try {
    alerts = JSON.parse(await fs.readFile(alertFile, "utf-8"));
  } catch {
    alerts = [];
  }

  const currentTime = new Date().toISOString();

  
  const geo = await getGeoData(ip);

  // 🔥 Rate Limit session logic
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
      return Date.now() - lastTime < 2 * 60 * 1000;
    });

    if (existingAlert) {
      existingAlert.count = (existingAlert.count || 1) + 1;
      existingAlert.lastTriggered = currentTime;
      existingAlert.url = url;

      await safeWrite(alertFile, alerts)
      alerts = JSON.parse(await fs.readFile(alertFile, "utf-8"))
      return;
    }
  }

  // ✅ New alert entry
  const newAlert = {
    requestId: `req_${Date.now()}`,
    time: new Date().toISOString(),
    ip,
    type,
    url,
    severity: getSeverity(type),

    count: 1,
    lastTriggered: currentTime,

    //NEW metadata
    method: req.method,
    userAgent: req.headers["user-agent"] || "unknown",

    markAsRead: "No",
    sendToAdmin: "Yes"
  };

  alerts.push(newAlert);

  await safeWrite(alertFile, alerts);

  //emit real-time alert
  const io = req.app.get("io");
  if (io) {
    io.emit("newAlert", newAlert);
  }
};