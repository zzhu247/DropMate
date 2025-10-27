import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import helmet from "helmet";
import createHttpError from "http-errors";
import morgan from "morgan";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = Number(process.env.PORT || 4000);
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || "http://identity-service:4001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service:4002";

app.set("trust proxy", true);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ALLOW_ORIGIN?.split(",") || "*",
    credentials: true
  })
);
app.use(compression());
app.use(express.json());
app.use(morgan("combined"));

// Health endpoint for quick diagnostics
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Proxy auth-related routes to the identity service
app.use(
  "/api/v1/auth",
  createProxyMiddleware({
    target: IDENTITY_SERVICE_URL,
    changeOrigin: true,
    proxyTimeout: 5000,
    pathRewrite: {
      "^/api/v1/auth": "/api/v1/auth"
    },
    onError(err, _req, res) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "identity service unavailable", detail: err.message }));
    }
  })
);

// Proxy order routes to the order service
app.use(
  "/api/v1/orders",
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    proxyTimeout: 5000,
    pathRewrite: {
      "^/api/v1/orders": "/api/v1/orders"
    },
    onError(err, _req, res) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "order service unavailable", detail: err.message }));
    }
  })
);

// Fallback for unknown routes
app.use((_req, _res, next) => {
  next(createHttpError(404, "Route not found"));
});

app.use((err: createHttpError.HttpError, _req: Request, res: Response) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
});

// Light-weight WebSocket hub for streaming notifications
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "connected", message: "Connected to DropMate gateway" }));

  socket.on("message", (data) => {
    // For now, echo the payload; future iterations will broadcast real-time order events.
    wss.clients.forEach((client) => {
      if (client.readyState === socket.OPEN) {
        client.send(data.toString());
      }
    });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on port ${PORT}`);
});
