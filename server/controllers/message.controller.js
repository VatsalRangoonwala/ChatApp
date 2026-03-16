import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import webpush from "../utils/webPush.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  const { chatId, text, receiverId, scheduledAt } = req.body;

  if (!chatId || !receiverId || !text) {
    return res.status(400).json({ message: "Invalid data" });
  }

  let scheduledMsg = await Message.findOne({
    chatId: chatId,
    text: text,
    isScheduled: true,
  });

  if (scheduledMsg) {
    console.log("here");
    scheduledMsg.isScheduled = false;
    scheduledMsg.scheduledAt = new Date();
    await scheduledMsg.save();
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: scheduledMsg._id,
    });
    scheduledMsg = await scheduledMsg.populate("sender", "name email");
    scheduledMsg = await scheduledMsg.populate("receiver", "name email");

    const receiver = await User.findById(receiverId);
    if (!receiver.isOnline && receiver.pushSubscription) {
      const payload = JSON.stringify({
        title: scheduledMsg.sender.name,
        body: scheduledMsg.text,
        chatId: scheduledMsg.chatId,
      });

      webpush
        .sendNotification(receiver.pushSubscription, payload)
        .catch(console.error);
    }
    return res.status(200).json(scheduledMsg);
  }

  try {
    let message = await Message.create({
      chatId,
      sender: req.user._id,
      receiver: receiverId,
      text,
      scheduledAt: scheduledAt || null,
      isScheduled: !!scheduledAt,
      status: scheduledAt ? "scheduled" : "sent",
    });

    // Update last message
    if (!scheduledAt) {
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
      });
    }

    message = await message.populate("sender", "name email");
    message = await message.populate("receiver", "name email");

    const receiver = await User.findById(receiverId);

    if (!receiver.isOnline && receiver.pushSubscription) {
      const payload = JSON.stringify({
        title: message.sender.name,
        body: message.text,
        chatId: message.chatId,
      });

      webpush
        .sendNotification(receiver.pushSubscription, payload)
        .catch(console.error);
    }
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMessage = async (req, res) => {
  const { text } = req.body;

  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  // only sender can edit
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (message.status === "seen") {
    return res.status(400).json({
      message: "Message can no longer be edited",
    });
  }

  message.text = text;
  message.edited = true;

  const updated = await message.save();

  const populated = await Message.findById(message._id).populate(
    "sender",
    "_id name avatar",
  );

  res.json(populated);
};

export const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const DELETE_LIMIT_MINUTES = 15;

  const messageTime = new Date(message.createdAt);
  const now = new Date();

  const diffMinutes = (now - messageTime) / (1000 * 60);

  if (diffMinutes > DELETE_LIMIT_MINUTES) {
    return res.status(400).json({
      message: "Delete time expired",
    });
  }

  message.deleted = true;

  await message.save();

  const populated = await Message.findById(message._id).populate(
    "sender",
    "_id name avatar",
  );

  res.json(populated);
};

// FETCH MESSAGES WITH PAGINATION
export const fetchMessages = async (req, res) => {
  const { chatId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = 20;

  try {
    const messages = await Message.find({
      chatId,
      $or: [
        { sender: req.user._id }, // sender sees everything
        {
          receiver: req.user._id,
          status: { $in: ["sent", "delivered", "seen"] }, // receiver sees only sent
        },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBeforeSent = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Scheduled message deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
