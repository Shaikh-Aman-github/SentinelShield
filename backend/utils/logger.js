const fs = require("fs");
const path = require("path");

const { getGeoData, getSourceType, getRiskScore, getFingerprint, getPayload } = require("./enrichData");

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

const isLocalIP = (ip) => {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  );
};

const getRequestMeta = (req) => {
  return {
    method: req.method,
    userAgent: req.headers["user-agent"] || "unknown",
    referer: req.headers["referer"] || "unknown",

    // keep only important headers
    headers: {
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"],
      "accept-language": req.headers["accept-language"]
    },

    query: req.query || {},

    // safe body capture (avoid huge data)
    body: req.body && Object.keys(req.body).length
      ? req.body
      : null
  };
};

module.exports = async (req, type, detectionStartTime) => {
  const ip =
  req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "unknown";
  const url = req.originalUrl;
  const method = req.method;
  
  let geo = { country: "Local", city: "Local", isp: "Local Machine"};
  let logs = [];

  try {
    logs = JSON.parse(fs.readFileSync(logFile));
  } catch {
    logs = [];
  }

  const currentTime = new Date().toISOString();
  const now = Date.now();

   // ⏱️ timing
  const detectionTime = Date.now() - detectionStartTime;
  const responseTime = Date.now() - detectionStartTime;

  // geo
  if (!isLocalIP(ip)) {
    geo = await getGeoData(ip);
  }

  // 🔥 Rate Limit logic (same as your version)
  if (type === "Rate Limit") {
    const existingLog = logs.find((log) => {
      if (
        log.type !== "Rate Limit" ||
        log.ip !== ip ||
        log.status === "Resolved"
      ) {
        return false;
      }

      const lastTime = new Date(log.lastTriggered).getTime();
      return now - lastTime < 2 * 60 * 1000;
    });

    if (existingLog) {
      existingLog.count = (existingLog.count || 1) + 1;
      existingLog.lastTriggered = currentTime;
      existingLog.url = url;

      if (!existingLog.details) existingLog.details = [];
      if (!existingLog.history) existingLog.history = [];

      existingLog.details.push({
        time: currentTime,
        url,
        method: req.method,
        message: "Rate limit exceeded",
        request: getRequestMeta(req)
      });

      existingLog.history.push({
        attemptTime: currentTime,
        url,
        method: req.method,
        message: "Repeated attacker behavior",
        request: getRequestMeta(req)
      });

      existingLog.ipStatus =
        existingLog.history.length > 3 ? "Suspicious" : "Normal";

      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      return;
    }

    const newRateLimitLog = {
      time: currentTime,
      ip,
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
          message: "Rate limit exceeded"
        }
      ],

      history: [
        {
          attemptTime: currentTime,
          url,
          method,
          message: "Repeated attacker behavior"
        }
      ]
    };

    logs.push(newRateLimitLog);

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    return;
  }

  // ✅ Normal attack log
  const newLog = {
    requestId: `req_${Date.now()}`,
    time: currentTime,

    ip,
    ipStatus: "Normal",

    geo,

    type,
    pattern: `${type} via request`,
    payload: getPayload(req),
    url: req.originalUrl,
    sourceType: getSourceType(userAgent),
    fingerprint: getFingerprint(ip, userAgent, type),
    
    severity: getSeverity(type),
    riskScore: getRiskScore(type),

    detectionTimeMs: detectionTime,
    responseTimeMs: responseTime,
    count: 1,
    lastTriggered: currentTime,
    attackStage: "Detected → Blocked",
    status: "Active",

    request: {
      method: req.method,
      userAgent,
      headers: req.headers,
      query: req.query,
      body: req.body || null
    },

    // 🔥 NEW metadata
    method,
    userAgent: req.headers["user-agent"] || "unknown"
  };

  logs.push(newLog);

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
};