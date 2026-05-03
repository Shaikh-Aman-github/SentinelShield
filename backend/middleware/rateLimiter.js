const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

const requestMap = {};

module.exports = (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;

  const currentTime = Date.now();

  const WINDOW_SIZE = 10 * 1000;
  const MAX_REQUESTS = 20;

  // ignore frontend polling
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

  requestMap[ip] = requestMap[ip].filter(
    (t) => currentTime - t < WINDOW_SIZE
  );

  requestMap[ip].push(currentTime);

  if (requestMap[ip].length > MAX_REQUESTS) {
    logger(req, "Rate Limit");
    alertLogger(req, "Rate Limit");

    console.log(`🚨 ALERT: Rate Limit detected from ${ip}`);

    return res.status(429).json({
      message: "Too many requests",
      status: "BLOCKED",
      alert: true
    });
  }

  next();
};