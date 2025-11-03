import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import parcelRoutes from "./routes/parcels.js";
import authRoutes from "./routes/auth.js";
import db from "./models/db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// REST routes
app.use("/api/parcels", parcelRoutes);
app.use("/api/auth", authRoutes);

// Setup WebSocket
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

app.set("io", io);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
