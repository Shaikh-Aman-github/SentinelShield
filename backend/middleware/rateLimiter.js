const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

const requestMap = {}; // store IP activity

module.exports = (req, res, next) => {
  // safer IP detection
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  const currentTime = Date.now();

  const WINDOW_SIZE = 10 * 1000; // 10 seconds
  const MAX_REQUESTS = 20;

  // 🔥 Ignore frontend internal API routes
  // otherwise frontend polling creates fake rate-limit attacks
  if (
    req.url.startsWith("/stats") ||
    req.url.startsWith("/logs") ||
    req.url.startsWith("/alerts")
  ) {
    return next();
  }

  if (!requestMap[ip]) {
    requestMap[ip] = [];
  }

  // keep only recent requests inside time window
  requestMap[ip] = requestMap[ip].filter(
    (timestamp) => currentTime - timestamp < WINDOW_SIZE
  );

  requestMap[ip].push(currentTime);

  // Rate limit triggered
  if (requestMap[ip].length > MAX_REQUESTS) {
    // save/update logs
    logger(ip, "Rate Limit", req.url);

    // save/update alerts for popup
    alertLogger(ip, "Rate Limit", req.url);

    console.log(`🚨 ALERT: Rate Limit detected from ${ip}`);

    return res.status(429).json({
      message: "Too many requests - Rate limit exceeded",
      status: "BLOCKED",
      alert: true
    });
  }

  next();
};