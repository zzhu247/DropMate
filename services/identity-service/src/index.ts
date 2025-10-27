import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";

dotenv.config();

type Role = "manager" | "driver" | "customer";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  password: string;
}

const users = new Map<string, UserRecord>();
const app = express();
const PORT = Number(process.env.PORT || 4001);
const JWT_SECRET = process.env.JWT_SECRET || "dropmate-dev-secret";

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

app.post("/api/v1/auth/register", (req: Request, res: Response) => {
  const { email, password, name, role = "manager" } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "email, password, and name are required" });
  }
  if (!["manager", "driver", "customer"].includes(role)) {
    return res.status(400).json({ message: "invalid role" });
  }

  if (users.has(email)) {
    return res.status(409).json({ message: "user already exists" });
  }

  const user: UserRecord = {
    id: randomUUID(),
    email,
    name,
    role,
    password
  };

  users.set(email, user);
  return res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

app.post("/api/v1/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "1h"
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

app.get("/api/v1/auth/profile", (req: Request, res: Response) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ message: "missing authorization header" });
  }

  const token = authorization.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = [...users.values()].find((rec) => rec.id === payload.sub);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    return res.status(401).json({ message: "invalid token", detail: (error as Error).message });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Identity service listening on port ${PORT}`);
});
