import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import msgRouter from "./routes/message.route.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket Setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", msgRouter);


// Socket Logic
import socketHandler from "./sockets/socket.js";
socketHandler(io);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
