import mongoose from "mongoose";

import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { buildParticipantKey } from "../utils/chat.js";

const participantSelection =
  "_id name email bio avatar isOnline isVerified updatedAt";

// Create or Get One-to-One Chat
export const accessChat = async (req, res) => {
  const userId = String(req.body.userId || "");

  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid userId is required", 400);
  }

  if (userId === req.user._id.toString()) {
    throw new AppError("You cannot create a chat with yourself", 400);
  }

  const otherUser = await User.findById(userId).select("_id");
  if (!otherUser) {
    throw new AppError("User not found", 404);
  }

  const participantKey = buildParticipantKey(req.user._id, userId);

  let chat = await Chat.findOne({
    $or: [
      { participantKey },
      {
        participants: {
          $all: [req.user._id, userId],
        },
        $expr: {
          $eq: [{ $size: "$participants" }, 2],
        },
      },
    ],
  }).populate("participants", participantSelection);

  if (chat) {
    if (!chat.participantKey) {
      chat.participantKey = participantKey;
      await chat.save();
    }

    return res.json(chat);
  }

  chat = await Chat.create({
    participants: [req.user._id, userId],
    participantKey,
  });

  const fullChat = await Chat.findById(chat._id).populate(
    "participants",
    participantSelection,
  );

  return res.status(201).json(fullChat);
};

// Fetch User Chats
export const fetchChats = async (req, res) => {
  const unreadMessages = await Message.aggregate([
    {
      $match: {
        receiver: req.user._id,
        status: { $ne: "seen" },
        deleted: false,
        isScheduled: false,
      },
    },
    {
      $group: {
        _id: "$chatId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = unreadMessages.reduce((accumulator, item) => {
    accumulator[item._id.toString()] = item.count;
    return accumulator;
  }, {});

  const chats = await Chat.find({
    participants: req.user._id,
  })
    .populate("participants", participantSelection)
    .populate(
      "lastMessage",
      "_id chatId sender receiver text image status edited deleted scheduledAt isScheduled createdAt updatedAt",
    )
    .sort({ updatedAt: -1 })
    .lean();

  return res.json({ chats, unreadMap });
};
