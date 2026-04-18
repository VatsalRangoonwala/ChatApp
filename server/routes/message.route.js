import express from "express";
import {
  sendMessage,
  sendScheduledMessageNow,
  fetchMessages,
  updateMessage,
  deleteMessage,
  deleteBeforeSent,
} from "../controllers/message.controller.js";
import protect from "../middlewares/auth.middleware.js";

const msgRouter = express.Router();

msgRouter.post("/", protect, sendMessage);
msgRouter.post("/schedule/:id/send-now", protect, sendScheduledMessageNow);
msgRouter.get("/:chatId", protect, fetchMessages);
msgRouter.put("/update/:id", protect, updateMessage);
msgRouter.delete("/delete/:id", protect, deleteMessage);
msgRouter.delete("/delete/schedule/:id", protect, deleteBeforeSent);

export default msgRouter;
