const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

module.exports = async (req, res, next) => {
  // ✅ Ignore frontend & internal calls
  if (
    req.url.startsWith("/logs") ||
    req.url.startsWith("/stats") ||
    req.url.startsWith("/alerts") ||
    req.url.startsWith("/favicon") ||
    req.url.includes(".js") ||
    req.url.includes(".css")
    // || req.headers["user-agent"]?.includes("Mozilla")
  ) {
    return next();
  }

  const startTime = Date.now();

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;

  const userAgent = (req.headers["user-agent"] || "").toLowerCase();

  const requestData = `
    URL: ${req.url}
    METHOD: ${req.method}
    HEADERS: ${JSON.stringify(req.headers)}
    BODY: ${JSON.stringify(req.body)}
    USER-AGENT: ${userAgent}
  `.toLowerCase();

  let attackType = null;

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

  // ✅ FIXED Command Injection (NO false positives)
  const cmdPatterns = [
    /(;|\||&&)\s*(ls|whoami|cat|pwd)/i
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
  } else if (sqlPatterns.some((p) => p.test(requestData))) {
    attackType = "SQL Injection";
  } else if (xssPatterns.some((p) => p.test(requestData))) {
    attackType = "XSS";
  } else if (lfiPatterns.some((p) => p.test(requestData))) {
    attackType = "LFI";
  } else if (cmdPatterns.some((p) => p.test(requestData))) {
    attackType = "Command Injection";
  } else if (dirTraversalPatterns.some((p) => p.test(requestData))) {
    attackType = "Directory Traversal";
  }

  if (attackType) {
    await logger(req, attackType, startTime);
    await alertLogger(req, attackType);

    console.log(`🚨 ALERT: ${attackType} detected from ${ip}`);

    return res.status(403).json({
      message: `${attackType} Detected`,
      status: "BLOCKED",
      alert: true,
      type: attackType
    });
  }

  next();
};