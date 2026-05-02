const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3000;

const logRoutes = require("./routes/logRoutes");
const statsRoutes = require("./routes/statsRoutes");
const alertRoutes = require("./routes/alertRoutes");

const detector = require("./middleware/detector");
const rateLimiter = require("./middleware/rateLimiter");

console.log("detector:", detector);
console.log("rateLimiter:", rateLimiter);

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// middleware
app.use(rateLimiter);
app.use(detector);

// routes
app.use("/logs", logRoutes);
app.use("/stats", statsRoutes);
app.use("/alerts", alertRoutes);

app.get("/", (req, res) => {
  res.send("🚀 SentinelShield MVC Running");
});

app.get("/test", (req, res) => {
  res.send("✅ Test route working");
});

app.get("/home", (req, res) => {
  res.send("✅ Home route working");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
