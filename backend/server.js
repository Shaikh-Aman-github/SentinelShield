const express = require("express");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 3000;

const logRoutes = require("./routes/logRoutes");
const statsRoutes = require("./routes/statsRoutes");
const alertRoutes = require("./routes/alertRoutes");

const detector = require("./middleware/detector");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// apply to ALL routes
app.use(rateLimiter);
app.use(detector);

// API routes (protected)
app.use("/logs", rateLimiter, detector, logRoutes);
app.use("/stats", rateLimiter, detector, statsRoutes);
app.use("/alerts", rateLimiter, detector, alertRoutes);

// test routes
app.get("/", (req, res) => {
  res.send("🚀 SentinelShield MVC Running");
});

app.get("/test", (req, res) => {
  res.send("✅ Test route working");
});

// ✅ frontend after API
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});