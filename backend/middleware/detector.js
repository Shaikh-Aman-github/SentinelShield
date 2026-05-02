const logger = require("../utils/logger");
const alertLogger = require("../utils/alertLogger");

module.exports = (req, res, next) => {
  // Ignore internal routes to prevent false positives
  if (
    req.url.startsWith("/logs") ||
    req.url.startsWith("/stats") ||
    req.url.startsWith("/alerts") ||
    req.url.startsWith("/favicon") ||
    req.url.includes(".js") ||
    req.url.includes(".css")
  ) {
    return next();
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;

  // 🔥 Header inspection
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();

  // 🔥 Full request inspection
  const requestData = `
    URL: ${req.url}
    METHOD: ${req.method}
    HEADERS: ${JSON.stringify(req.headers)}
    BODY: ${JSON.stringify(req.body)}
    USER-AGENT: ${userAgent}
  `.toLowerCase();

  let attackType = null;

  // -------------------------
  // SQL Injection
  // -------------------------
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /\b(or|and)\b.+\=/i,
    /union.+select/i,
    /or 1=1/i
  ];

  // -------------------------
  // XSS
  // -------------------------
  const xssPatterns = [
    /<script.*?>.*?<\/script>/i,
    /onerror\s*=/i,
    /javascript:/i
  ];

  // -------------------------
  // LFI (Local File Inclusion)
  // -------------------------
  const lfiPatterns = [
    /etc\/passwd/i,
    /boot\.ini/i,
    /windows\/system32/i
  ];

  // -------------------------
  // Command Injection
  // -------------------------
  const cmdPatterns = [
    /(;|\||&&)\s*\w+/i
  ];

  // -------------------------
  // Directory Traversal
  // -------------------------
  const dirTraversalPatterns = [
    /\.\.\//i,
    /\.\.\\/i
  ];

  // -------------------------
  // Suspicious Header Detection
  // -------------------------
  const suspiciousHeaderPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burpsuite/i
  ];

  // -------------------------
  // Detection Logic
  // -------------------------

  // Suspicious header check first
  if (suspiciousHeaderPatterns.some((p) => p.test(userAgent))) {
    attackType = "Suspicious Header Activity";
  }

  else if (sqlPatterns.some((p) => p.test(requestData))) {
    attackType = "SQL Injection";
  }

  else if (xssPatterns.some((p) => p.test(requestData))) {
    attackType = "XSS";
  }

  else if (lfiPatterns.some((p) => p.test(requestData))) {
    attackType = "LFI";
  }

  else if (cmdPatterns.some((p) => p.test(requestData))) {
    attackType = "Command Injection";
  }

  else if (dirTraversalPatterns.some((p) => p.test(requestData))) {
    attackType = "Directory Traversal";
  }

  // -------------------------
  // ACTION (Detection Found)
  // -------------------------
  if (attackType) {
    logger(ip, attackType, req.url);
    alertLogger(ip, attackType, req.url);

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