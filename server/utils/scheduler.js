import cron from "node-cron";
import Message from "../models/message.model.js";
import { io } from "../server.js";
import Chat from "../models/chat.model.js";
import { getSocketId } from "../sockets/socket.js";

cron.schedule("*/10 * * * * *", async () => {
  const now = new Date();

  const msg = await Message.findOne({
    isScheduled: true,
    scheduledAt: { $lte: now },
  }).populate("sender receiver");

  if (msg) {
    msg.isScheduled = false;
    if (msg.receiver?.isOnline) {
      msg.status = "delivered";
    } else {
      msg.status = "sent";
    }

    await Chat.findByIdAndUpdate(msg.chatId, {
      lastMessage: msg._id,
    });

    await msg.save();

    // send realtime
    const receiver = getSocketId(msg.receiver._id.toString());
    const sender = getSocketId(msg.sender._id.toString());
    io.to(sender).emit("receive-message", msg);
    io.to(receiver).emit("receive-message", msg);
    console.log("Scheduled message sent");
  }
});
