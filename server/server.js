import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import msgRouter from "./routes/message.route.js";
import userRouter from "./routes/user.route.js";
import socketHandler from "./sockets/socket.js";
import "./utils/scheduler.js";

dotenv.config();
connectDB();

const app = express();
app.get("/ping", (req, res) => {
  res.status(200).send("Pounce Server is Awake!");
});
const server = http.createServer(app);

// Socket Setup
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", msgRouter);
app.use("/api/user", userRouter);

// Socket Logic
socketHandler(io);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("Server running...");
});
