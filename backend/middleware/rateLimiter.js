// rateLimiter.js

const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

const requestMap = {};
const lastAlertTime = {};
const blockedIPs = {};

//Cleanup inactive IPs every 1 min
setInterval(() => {
  const now = Date.now();

  Object.keys(requestMap).forEach((ip) => {
    requestMap[ip] = requestMap[ip].filter(
      (t) => now - t < 60 * 1000
    );

    if (requestMap[ip].length === 0) {
      delete requestMap[ip];
    }
  });
}, 60000);

module.exports = async (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;

  const currentTime = Date.now();

  //route-based limits
  let WINDOW_SIZE = 30 * 1000;
  let MAX_REQUESTS = 5;

  if (req.url.includes("/login")) {
    MAX_REQUESTS = 5;
  }

  if (req.url.includes("/admin")) {
    MAX_REQUESTS = 3;
  }

  //Ignore internal/static/dashboard calls
  if (
    req.url.startsWith("/stats") ||
    req.url.startsWith("/logs") ||
    req.url.startsWith("/alerts") ||
    /\.(js|css|png|jpg|jpeg|svg|ico)$/i.test(req.url) ||
    req.url.includes("cmd=") ||
    req.url.includes("<script") ||
    req.url.includes("../")
  ) {
    return next();
  }

  //Check temporary blocked IP
  if (blockedIPs[ip] && blockedIPs[ip] > currentTime) {
    return res.status(403).json({
      message: "IP temporarily blocked",
      retryAfter: `${Math.ceil(
        (blockedIPs[ip] - currentTime) / 1000
      )} seconds`,
      status: "BLOCKED",
      alert: true
    });
  }

  //Init request tracking
  if (!requestMap[ip]) {
    requestMap[ip] = [];
  }

  //Keep only requests inside window
  requestMap[ip] = requestMap[ip].filter(
    (t) => currentTime - t < WINDOW_SIZE
  );

  requestMap[ip].push(currentTime);

  //Attack speed calculation
  const requestSpeed =
    requestMap[ip].length / (WINDOW_SIZE / 1000);

  console.log(
    `[RATE CHECK] IP: ${ip} | Count: ${requestMap[ip].length} | Speed: ${requestSpeed.toFixed(
      2
    )}/sec`
  );

  //Rate limit exceeded
  if (requestMap[ip].length > MAX_REQUESTS) {
    const now = Date.now();

    //Temporary ban for repeated abuse
    if (requestMap[ip].length > MAX_REQUESTS + 10) {
      blockedIPs[ip] = now + 60 * 1000;

      console.log(`TEMP BLOCKED IP: ${ip}`);
    }

    //Log attack
    await logger(req, "Rate Limit");

    //Prevent alert spam
    if (
      !lastAlertTime[ip] ||
      now - lastAlertTime[ip] > 10000
    ) {
      lastAlertTime[ip] = now;

      await alertLogger(req, "Rate Limit");

      console.log(`ALERT: Rate Limit detected from ${ip}`);
    }

    return res.status(429).json({
      message: "Too many requests",
      retryAfter: "10 seconds",
      status: "BLOCKED",
      alert: true,
      requestCount: requestMap[ip].length,
      speed: `${requestSpeed.toFixed(2)} req/sec`
    });
  }

  next();
};