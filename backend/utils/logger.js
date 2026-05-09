//Logger.js 
const fs = require("fs/promises");
const path = require("path");

const { safeWrite } = require("./fileLock");
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
    logs = JSON.parse(await fs.readFile(logFile, "utf-8"));
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
    const SESSION_WINDOW = 10000; // 10 sec
    const COOLDOWN = 2 * 60 * 1000; // 2 min

    const existingLog = logs.find((log) => {
      if (log.type !== "Rate Limit" || log.ip !== ip) return false;

      const lastTime = new Date(log.lastTriggered).getTime();
      const timeDiff = Date.now() - lastTime;

      //OLD attack → DO NOT reuse
      if (timeDiff > COOLDOWN) return false;

      //SAME session → reuse
      return timeDiff < SESSION_WINDOW;
    });

    if (existingLog) {
      existingLog.count += 1;
      existingLog.lastTriggered = currentTime;

      if (existingLog.count >= 25) {
        existingLog.ipStatus = "Malicious";
      } else if (existingLog.count >= 10) {
        existingLog.ipStatus = "Suspicious";
      } else {
        existingLog.ipStatus = "Normal";
      }
      
      existingLog.details.push({
        time: currentTime,
        url,
        method,
        payload: getPayload(req),
        riskScore: getRiskScore(type),
        request: getRequestMeta(req)
      });

      // Only push to history AFTER first attack already exists
      if (existingLog.count > 1) {
           const lastHistory = existingLog.history[existingLog.history.length - 1];

        // Only add new history if last one was >10 sec ago
        if (
          !lastHistory ||
          Date.now() - new Date(lastHistory.attemptTime).getTime() > 10000
        ) {
          existingLog.history.push({
            attemptTime: currentTime,
            url,
            method,
            payload: getPayload(req),
            fingerprint: getFingerprint(ip, userAgent, type)
          });
        }
      }

      await safeWrite(logFile, logs);
      return;
    }

    const newRateLimitLog = {
      sessionId: `sess_${ip}_${Date.now()}`,
      time: currentTime,
      sessionStart: currentTime,
      
      ip,
      ipStatus: "Normal",
      geo,

      type,
      severity: getSeverity(type),

      url,
      payload: getPayload(req),

      sourceType: getSourceType(userAgent),
      fingerprint: getFingerprint(ip, userAgent, type),
      riskScore: getRiskScore(type),
      falsePositive: req.falsePositive || false,
      count: 1,
      lastTriggered: currentTime,
      status: "Active",

      details: [
        {
          time: currentTime,
          url,
          method,
          payload: getPayload(req),
          request: getRequestMeta(req)
        }
      ],

      history: []
    };

    logs.push(newRateLimitLog);

    await safeWrite(logFile, logs);

    const io = req.app.get("io");
    if (io) {
      io.emit("newAttack", newRateLimitLog);
    }

    return;
  }
  //Normal attack log
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
    falsePositive: req.falsePositive || false,
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

  await safeWrite(logFile, logs);

  //emit real-time attack
  const io = req.app.get("io");
  if (io) {
    io.emit("newAttack", newLog);
  }
};


