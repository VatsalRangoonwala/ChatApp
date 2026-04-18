import mongoose from "mongoose";

import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { sendPushNotification } from "../utils/webPush.js";
import { trimString } from "../utils/validators.js";
import { io } from "../server.js";
import { getUserRoom, isUserOnline } from "../sockets/socket.js";

const MESSAGE_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 2000;
const DELETE_LIMIT_MINUTES = 15;
const senderSelection = "_id name email avatar";
const receiverSelection = "_id name email avatar";

const populateMessageById = async (messageId) => {
  return Message.findById(messageId)
    .populate("sender", senderSelection)
    .populate("receiver", receiverSelection);
};

const assertChatMembership = async (chatId, userId) => {
  if (!mongoose.isValidObjectId(chatId)) {
    throw new AppError("Invalid chat id", 400);
  }

  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
  });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  return chat;
};

const emitToParticipants = (eventName, message) => {
  const senderId = message.sender?._id || message.sender;
  const receiverId = message.receiver?._id || message.receiver;

  io.to(getUserRoom(senderId)).emit(eventName, message);
  io.to(getUserRoom(receiverId)).emit(eventName, message);
};

const sendOfflinePushIfNeeded = async (receiverId, message) => {
  if (message.isScheduled || isUserOnline(receiverId)) {
    return;
  }

  const receiver = await User.findById(receiverId).select("pushSubscription");
  if (!receiver?.pushSubscription) {
    return;
  }

  const payload = JSON.stringify({
    title: message.sender.name,
    body: message.text,
    chatId: message.chatId,
  });

  await sendPushNotification(receiver.pushSubscription, payload);
};

const getReceiverId = (chat, senderId) => {
  const receiverId = chat.participants.find(
    (participantId) => participantId.toString() !== senderId.toString(),
  );

  if (!receiverId) {
    throw new AppError("Receiver not found for this chat", 400);
  }

  return receiverId;
};

const updateChatLastMessage = async (chatId, messageId) => {
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: messageId,
  });
};

const getLatestDeliveredMessageId = async (chatId, excludedMessageId) => {
  const latestMessage = await Message.findOne({
    chatId,
    _id: { $ne: excludedMessageId },
    isScheduled: false,
  })
    .sort({ createdAt: -1 })
    .select("_id");

  return latestMessage?._id || null;
};

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  const chatId = String(req.body.chatId || "");
  const text = trimString(req.body.text || "");
  const requestedReceiverId = req.body.receiverId
    ? String(req.body.receiverId)
    : null;
  const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;

  if (!text) {
    throw new AppError("Message text is required", 400);
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
      400,
    );
  }

  const chat = await assertChatMembership(chatId, req.user._id);
  const receiverId = getReceiverId(chat, req.user._id);

  if (requestedReceiverId && requestedReceiverId !== receiverId.toString()) {
    throw new AppError("Receiver does not match this chat", 400);
  }

  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new AppError("Scheduled time is invalid", 400);
  }

  if (scheduledAt && scheduledAt <= new Date()) {
    throw new AppError("Scheduled time must be in the future", 400);
  }

  const receiverOnline = isUserOnline(receiverId);
  const message = await Message.create({
    chatId,
    sender: req.user._id,
    receiver: receiverId,
    text,
    scheduledAt,
    isScheduled: Boolean(scheduledAt),
    status: scheduledAt ? "scheduled" : receiverOnline ? "delivered" : "sent",
  });

  if (!scheduledAt) {
    await updateChatLastMessage(chatId, message._id);
  }

  const populatedMessage = await populateMessageById(message._id);

  if (!scheduledAt) {
    emitToParticipants("receive-message", populatedMessage);
    await sendOfflinePushIfNeeded(receiverId, populatedMessage);
  }

  return res.status(201).json(populatedMessage);
};

export const sendScheduledMessageNow = async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new AppError("Scheduled message not found", 404);
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new AppError("Not allowed", 403);
  }

  if (!message.isScheduled) {
    throw new AppError("Message is not scheduled", 400);
  }

  const receiverOnline = isUserOnline(message.receiver);
  message.isScheduled = false;
  message.scheduledAt = new Date();
  message.status = receiverOnline ? "delivered" : "sent";
  await message.save();

  await updateChatLastMessage(message.chatId, message._id);

  const populatedMessage = await populateMessageById(message._id);
  emitToParticipants("receive-message", populatedMessage);
  await sendOfflinePushIfNeeded(message.receiver, populatedMessage);

  return res.json(populatedMessage);
};

export const updateMessage = async (req, res) => {
  const text = trimString(req.body.text || "");
  if (!text) {
    throw new AppError("Message text is required", 400);
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
      400,
    );
  }

  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new AppError("Not allowed", 403);
  }

  if (message.deleted) {
    throw new AppError("Deleted messages cannot be edited", 400);
  }

  if (!message.isScheduled && message.status === "seen") {
    throw new AppError("Message can no longer be edited", 400);
  }

  message.text = text;
  message.edited = true;
  await message.save();

  const populatedMessage = await populateMessageById(message._id);
  emitToParticipants("message-updated", populatedMessage);

  return res.json(populatedMessage);
};

export const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new AppError("Not allowed", 403);
  }

  if (message.isScheduled) {
    throw new AppError("Use the scheduled message delete endpoint instead", 400);
  }

  const diffMinutes = (Date.now() - message.createdAt.getTime()) / (1000 * 60);

  if (diffMinutes > DELETE_LIMIT_MINUTES) {
    throw new AppError("Delete time expired", 400);
  }

  message.deleted = true;
  await message.save();

  const populatedMessage = await populateMessageById(message._id);
  emitToParticipants("message-deleted", populatedMessage);

  return res.json(populatedMessage);
};

// FETCH MESSAGES WITH PAGINATION
export const fetchMessages = async (req, res) => {
  const { chatId } = req.params;
  const page = Math.max(Number(req.query.page) || 1, 1);

  await assertChatMembership(chatId, req.user._id);

  const messages = await Message.find({
    chatId,
    $or: [
      { sender: req.user._id },
      {
        receiver: req.user._id,
        status: { $in: ["sent", "delivered", "seen"] },
      },
    ],
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * MESSAGE_LIMIT)
    .limit(MESSAGE_LIMIT)
    .populate("sender", senderSelection)
    .populate("receiver", receiverSelection)
    .lean();

  return res.json(messages.reverse());
};

export const deleteBeforeSent = async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new AppError("Scheduled message not found", 404);
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new AppError("Not allowed", 403);
  }

  if (!message.isScheduled) {
    throw new AppError("Message is not scheduled", 400);
  }

  await Message.findByIdAndDelete(message._id);

  const chat = await Chat.findById(message.chatId).select("lastMessage");
  if (chat?.lastMessage?.toString() === message._id.toString()) {
    const latestMessageId = await getLatestDeliveredMessageId(
      message.chatId,
      message._id,
    );

    await Chat.findByIdAndUpdate(message.chatId, {
      lastMessage: latestMessageId,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Scheduled message deleted",
  });
};
