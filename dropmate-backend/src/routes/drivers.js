import express from "express";
import rateLimit from "express-rate-limit";
import {
  listDrivers,
  updateDriverStatus,
  addDriverLocationEvent,
} from "../models/driverModel.js";
import { getDriverActiveOrders } from "../models/orderModel.js";

const router = express.Router();

// Rate limiter for location updates (max 60 updates per minute per driver)
const locationUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute (1 per second)
  keyGenerator: (req) => `driver-location-${req.params.id}`,
  message: { error: "Too many location updates. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/drivers → list all drivers
router.get("/", async (_req, res) => {
  try {
    const drivers = await listDrivers();
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// GET /api/drivers/:id/orders → get active orders for a driver
router.get("/:id/orders", async (req, res) => {
  try {
    const orders = await getDriverActiveOrders(req.params.id);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch driver orders" });
  }
});

// PATCH /api/drivers/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const updated = await updateDriverStatus(req.params.id, req.body.status);
    const io = req.app.get("io");
    io.to("all-drivers").emit("driver_status_updated", updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update driver status" });
  }
});

// POST /api/drivers/:id/location
router.post("/:id/location", locationUpdateLimiter, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const event = await addDriverLocationEvent(
      req.params.id,
      latitude,
      longitude
    );

    // Broadcast real-time update to all-drivers room
    const io = req.app.get("io");
    io.to("all-drivers").emit("driver_location_updated", {
      driverId: req.params.id,
      latitude,
      longitude,
    });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add driver location" });
  }
});

export default router;
