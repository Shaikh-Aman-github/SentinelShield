//Server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
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

// Socket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    origin: "https://your-project.vercel.app"
  }
});
// make io globally
app.set("io", io);
io.on("connection", (socket) => {
  console.log("Client Socket connected");

  socket.on("disconnect", () => {
    console.log("Client Socket disconnected");
  });
});


// apply to ALL routes
app.use(detector);
app.use(rateLimiter);

// API routes (protected)
app.use("/logs", logRoutes);
app.use("/stats", statsRoutes);
app.use("/alerts", alertRoutes);

// test routes
app.get("/", (req, res) => res.send("SentinelShield Running"));
app.get("/test", (req, res) => res.send("Test route working"));

//frontend calling
// app.use(express.static(path.join(__dirname, "../frontend/dist")));

// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
// });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});