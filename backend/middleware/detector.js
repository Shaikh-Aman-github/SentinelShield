//detector.js
const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

//Helper: detect likely false positives
const isLikelyFalsePositive = (req, type) => {
  const url = req.originalUrl.toLowerCase();

  // Example: search queries with ' (common legit use)
  if (type === "SQL Injection") {
    if (url.includes("search") && url.includes("'")) {
      return true;
    }
  }

  return false;
};


module.exports = async (req, res, next) => {
  //Ignore frontend & internal calls
  if (
    req.method === "GET" && (
    req.url.startsWith("/logs") ||
    req.url.startsWith("/stats") ||
    req.url.startsWith("/alerts") ||
    req.url.startsWith("/favicon") ||
    req.url.includes(".js") ||
    req.url.includes(".css"))
  ) {
    return next();
  }

  const startTime = Date.now();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();

  const requestData = `
    URL: ${req.url}
    METHOD: ${req.method}
    HEADERS: ${JSON.stringify(req.headers)}
    BODY: ${JSON.stringify(req.body)}
    USER-AGENT: ${userAgent}
  `.toLowerCase();

  let attackType = null;
  let isFalsePositive = false;

  // SQL Injection
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /\b(or|and)\b.+\=/i,
    /union.+select/i,
    /or 1=1/i
  ];

  // XSS
  const xssPatterns = [
    /<script.*?>.*?<\/script>/i,
    /onerror\s*=/i,
    /javascript:/i
  ];

  // LFI
  const lfiPatterns = [
    /etc\/passwd/i,
    /boot\.ini/i,
    /windows\/system32/i
  ];

  //Command Injection
  const cmdPatterns = [
    /(;|\||&&)\s*(ls|whoami|cat|pwd)/i,/(ls|whoami|cat|pwd)\s*(;|\||&&)/i
  ];

  // Directory Traversal
  const dirTraversalPatterns = [
    /\.\.\//i,
    /\.\.\\/i
  ];

  // Suspicious headers
  const suspiciousHeaderPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burpsuite/i
  ];

  if (suspiciousHeaderPatterns.some((p) => p.test(userAgent))) {
    attackType = "Suspicious Header Activity";
  } else if (dirTraversalPatterns.some((p) => p.test(requestData))) {
    attackType = "Directory Traversal";
  } else if (sqlPatterns.some((p) => p.test(requestData))) {
    attackType = "SQL Injection";
    isFalsePositive = isLikelyFalsePositive(req, attackType); //Detect false positive
  } else if (xssPatterns.some((p) => p.test(requestData))) {
    attackType = "XSS";
  } else if (lfiPatterns.some((p) => p.test(requestData))) {
    attackType = "LFI";
  } else if (cmdPatterns.some((p) => p.test(requestData))) {
    attackType = "Command Injection";
  }

  if (attackType) {
    req.falsePositive = isFalsePositive;  // Attach flag to request
    await logger(req, attackType, startTime);
    await alertLogger(req, attackType);

    console.log(
      `ALERT: ${attackType} detected from ${ip}` +
      (isFalsePositive ? " (Possible False Positive)" : "")
    );

    return res.status(403).json({
      message: `${attackType} Detected`,
      status: "BLOCKED",
      alert: true,
      type: attackType,
      falsePositive: isFalsePositive
    });
  }

  next();
};