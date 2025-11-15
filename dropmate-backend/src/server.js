import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import shipmentRoutes from "./routes/shipments.js";
import authRoutes from "./routes/auth.js";
import db from "./models/db.js";
import orderRoutes from "./routes/orders.js";
import driverRoutes from "./routes/drivers.js";
import messageRoutes from "./routes/messages.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// REST routes
app.use("/api/shipments", shipmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/messages", messageRoutes);

// Setup WebSocket with WSL2-friendly configuration
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  pingTimeout: 60000,      // Increase timeout for WSL2
  pingInterval: 25000,     // More frequent pings
  upgradeTimeout: 30000,   // More time for WebSocket upgrade
  transports: ['polling', 'websocket'],  // Try polling first
  allowUpgrades: true
});

io.on("connection", socket => {
  console.log(`Client connected: ${socket.id}`);

  // Subscribe to all driver updates by default
  socket.on("subscribe_all_drivers", () => {
    socket.join("all-drivers");
    console.log(`${socket.id} subscribed to all drivers`);
  });

  // Subscribe to specific driver updates
  socket.on("subscribe_driver", (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`${socket.id} subscribed to driver ${driverId}`);
  });

  // Unsubscribe from specific driver
  socket.on("unsubscribe_driver", (driverId) => {
    socket.leave(`driver-${driverId}`);
    console.log(`${socket.id} unsubscribed from driver ${driverId}`);
  });

  // Subscribe to specific region/area (for future use)
  socket.on("subscribe_region", (region) => {
    socket.join(`region-${region}`);
    console.log(`${socket.id} subscribed to region ${region}`);
  });

  // Unsubscribe from region
  socket.on("unsubscribe_region", (region) => {
    socket.leave(`region-${region}`);
    console.log(`${socket.id} unsubscribed from region ${region}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
