import express from "express";
import { listParcels, updateParcelStatus } from "../models/parcelModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const parcels = await listParcels();
    res.json(parcels); 
  } catch (err) {
    console.error("GET /api/parcels failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateParcelStatus(id, status);
    const io = req.app.get("io");
    io.emit("parcel_updated", { id: Number(id), status });
    res.json({ success: true, parcel: updated });
  } catch (err) {
    console.error("PATCH /api/parcels failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
