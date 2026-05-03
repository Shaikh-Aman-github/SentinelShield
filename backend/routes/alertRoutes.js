const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const alertFile = path.join(__dirname, "../data/alerts.json");

const readAlerts = () => {
  try {
    return JSON.parse(fs.readFileSync(alertFile));
  } catch {
    return [];
  }
};

const writeAlerts = (alerts) => {
  fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
};


// GET only NEW alerts for popup
router.get("/", (req, res) => {
  let alerts = readAlerts();

  const index = alerts.findIndex(alert => alert.sendToAdmin === "No");

  if (index === -1) {
    return res.json([]); // no new alerts
  }

  const alertToSend = alerts[index];

  // 🔥 Immediately mark as sent
  alerts[index].sendToAdmin = "Yes";

  writeAlerts(alerts);

  res.json([alertToSend]);
});

// GET full alert history
router.get("/history", (req, res) => {
  let alerts = readAlerts();

  res.json(alerts.slice(-20).reverse());
});


// UPDATE sendToAdmin after popup shown
router.put("/mark-sent", (req, res) => {
  let alerts = readAlerts();

  alerts = alerts.map(alert => ({
    ...alert,
    sendToAdmin: "Yes"
  }));

  writeAlerts(alerts);

  res.json({
    message: "Alerts marked as sent"
  });
});


// UPDATE markAsRead manually
router.put("/mark-read", (req, res) => {
  let alerts = readAlerts();

  alerts = alerts.map(alert => ({
    ...alert,
    markAsRead: "Yes"
  }));

  writeAlerts(alerts);

  res.json({
    message: "Alerts marked as read"
  });
});

module.exports = router;