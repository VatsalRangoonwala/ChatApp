import express from "express";
import { accessChat, fetchChats } from "../controllers/chat.controller.js";
import protect from "../middlewares/auth.middleware.js";

const chatRouter = express.Router();

chatRouter.post("/", protect, accessChat);
chatRouter.get("/", protect, fetchChats);

export default chatRouter;
