import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import msgRouter from "./routes/message.route.js";
import socketHandler from "./sockets/socket.js";
import { logger } from "./utils/logger.js";
import { startScheduler } from "./utils/scheduler.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const getAllowedOrigins = () => {
  const configuredOrigins =
    process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "";

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);

// Socket Setup
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  },
});

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/ping", (req, res) => {
  res.status(200).send("Pounce Server is Awake!");
});

app.get("/health", (req, res) => {
  return res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;

  return res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ready" : "not_ready",
    mongoState: mongoose.connection.readyState,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", msgRouter);
app.use("/api/user", userRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

const bootstrap = async () => {
  await connectDB();
  socketHandler(io);
  startScheduler(io);

  server.listen(PORT, () => {
    logger.info("Server running");
  });
};

bootstrap().catch((error) => {
  logger.error("Server failed to start", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
