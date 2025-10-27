import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "crypto";

dotenv.config();

type OrderStatus = "created" | "assigned" | "picked_up" | "delivered" | "cancelled";

interface OrderRecord {
  id: string;
  customerId: string;
  driverId?: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const orders = new Map<string, OrderRecord>();
const app = express();
const PORT = Number(process.env.PORT || 4002);

app.use(
  cors({
    origin: process.env.CORS_ALLOW_ORIGIN?.split(",") || "*",
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/v1/orders", (_req: Request, res: Response) => {
  res.json({ data: Array.from(orders.values()) });
});

app.get("/api/v1/orders/:id", (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "order not found" });
  }
  return res.json(order);
});

app.post("/api/v1/orders", (req: Request, res: Response) => {
  const { customerId, pickupAddress, dropoffAddress } = req.body;
  if (!customerId || !pickupAddress || !dropoffAddress) {
    return res.status(400).json({ message: "customerId, pickupAddress, dropoffAddress required" });
  }

  const now = new Date().toISOString();
  const record: OrderRecord = {
    id: randomUUID(),
    customerId,
    pickupAddress,
    dropoffAddress,
    status: "created",
    createdAt: now,
    updatedAt: now
  };

  orders.set(record.id, record);
  return res.status(201).json(record);
});

app.patch("/api/v1/orders/:id/assign", (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "order not found" });
  }

  const { driverId } = req.body;
  if (!driverId) {
    return res.status(400).json({ message: "driverId required" });
  }

  order.driverId = driverId;
  order.status = "assigned";
  order.updatedAt = new Date().toISOString();

  orders.set(order.id, order);
  return res.json(order);
});

app.patch("/api/v1/orders/:id/status", (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "order not found" });
  }

  const { status } = req.body as { status?: OrderStatus };
  if (!status || !["created", "assigned", "picked_up", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "invalid status" });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  orders.set(order.id, order);
  return res.json(order);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Order service listening on port ${PORT}`);
});
