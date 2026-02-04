import express from "express";
import {
  sendMessage,
  fetchMessages,
} from "../controllers/message.controller.js";
import protect from "../middlewares/auth.middleware.js";

const msgRouter = express.Router();

msgRouter.post("/", protect, sendMessage);
msgRouter.get("/:chatId", protect, fetchMessages);

export default msgRouter;
