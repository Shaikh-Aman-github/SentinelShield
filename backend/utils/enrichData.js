//enrichData.js
const axios = require("axios");

// 🔥 GEO + ISP
const getGeoData = async (ip) => {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    return {
      country: res.data.country || "Unknown",
      city: res.data.city || "Unknown",
      isp: res.data.isp || "Unknown"
    };
  } catch {
    return {
      country: "Unknown",
      city: "Unknown",
      isp: "Unknown"
    };
  }
};

// 🔥 Source Type
const getSourceType = (userAgent = "") => {
  const ua = userAgent.toLowerCase();

  if (ua.includes("curl")) return "Script";
  if (ua.includes("sqlmap")) return "Attack Tool";
  if (ua.includes("mozilla")) return "Browser";

  return "Unknown";
};

// 🔥 Risk Score
const getRiskScore = (type) => {
  switch (type) {
    case "Command Injection":
      return 10;
    case "SQL Injection":
      return 9;
    case "XSS":
      return 7;
    case "LFI":
      return 6;
    case "Directory Traversal":
      return 5;
    case "Rate Limit":
      return 3;
    default:
      return 1;
  }
};

// 🔥 Fingerprint
const getFingerprint = (ip, ua, type) => {
  return `${ip}_${ua.split("/")[0]}_${type.replace(/\s/g, "")}`;
};

// 🔥 Payload extraction
const getPayload = (req) => {
  if (req.query && Object.keys(req.query).length > 0) {
    return JSON.stringify(req.query);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  return "N/A";
};

module.exports = {
  getGeoData,
  getSourceType,
  getRiskScore,
  getFingerprint,
  getPayload
};