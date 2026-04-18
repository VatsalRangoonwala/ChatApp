import cron from "node-cron";

import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { getUserRoom, isUserOnline } from "../sockets/socket.js";
import { sendPushNotification } from "./webPush.js";
import { logger } from "./logger.js";

const SCHEDULE_BATCH_SIZE = 25;
const SENDER_SELECTION = "_id name email avatar";
const RECEIVER_SELECTION = "_id name email avatar pushSubscription";

const processScheduledMessages = async (io) => {
  let processed = 0;

  while (processed < SCHEDULE_BATCH_SIZE) {
    const message = await Message.findOneAndUpdate(
      {
        isScheduled: true,
        scheduledAt: { $lte: new Date() },
      },
      {
        $set: { isScheduled: false },
      },
      {
        sort: { scheduledAt: 1 },
        returnDocument: "after",
      },
    )
      .populate("sender", SENDER_SELECTION)
      .populate("receiver", RECEIVER_SELECTION);

    if (!message) {
      break;
    }

    const receiverOnline = isUserOnline(message.receiver._id);
    message.status = receiverOnline ? "delivered" : "sent";
    await message.save();

    await Chat.findByIdAndUpdate(message.chatId, {
      lastMessage: message._id,
    });

    io.to(getUserRoom(message.sender._id)).emit("receive-message", message);
    io.to(getUserRoom(message.receiver._id)).emit("receive-message", message);

    if (!receiverOnline && message.receiver.pushSubscription) {
      const payload = JSON.stringify({
        title: message.sender.name,
        body: message.text,
        chatId: message.chatId,
      });

      await sendPushNotification(message.receiver.pushSubscription, payload);
    }

    processed += 1;
  }

  if (processed > 0) {
    logger.info("Processed scheduled messages", {
      count: processed,
    });
  }
};

export const startScheduler = (io) => {
  cron.schedule("*/5 * * * * *", () => {
    void processScheduledMessages(io);
  });
};
