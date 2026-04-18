import jwt from "jsonwebtoken";

import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";

const onlineUsers = new Map(); // userId -> Set<socketId>

const extractTokenFromCookie = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length);
};

const addSocketForUser = (userId, socketId) => {
  const currentSockets = onlineUsers.get(userId) || new Set();
  currentSockets.add(socketId);
  onlineUsers.set(userId, currentSockets);
  return currentSockets.size;
};

const removeSocketForUser = (userId, socketId) => {
  const currentSockets = onlineUsers.get(userId);
  if (!currentSockets) {
    return 0;
  }

  currentSockets.delete(socketId);

  if (currentSockets.size === 0) {
    onlineUsers.delete(userId);
    return 0;
  }

  onlineUsers.set(userId, currentSockets);
  return currentSockets.size;
};

export const getUserRoom = (userId) => {
  return `user:${userId.toString()}`;
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        extractTokenFromCookie(socket.handshake.headers.cookie);

      if (!token) {
        return next(new AppError("No token", 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      return next();
    } catch (error) {
      return next(new AppError("Authentication error", 401));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId.toString();
    const connectionCount = addSocketForUser(userId, socket.id);

    socket.join(getUserRoom(userId));

    if (connectionCount === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit("user-online", userId);
    }

    const undeliveredMessages = await Message.find({
      receiver: userId,
      status: "sent",
      isScheduled: false,
    }).select("_id sender");

    if (undeliveredMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: undeliveredMessages.map((message) => message._id) },
        },
        {
          $set: { status: "delivered" },
        },
      );

      for (const message of undeliveredMessages) {
        io.to(getUserRoom(message.sender)).emit("message-delivered", {
          messageId: message._id,
        });
      }
    }

    socket.on("typing", ({ receiverId, chatId }) => {
      if (!receiverId || !chatId) {
        return;
      }

      io.to(getUserRoom(receiverId)).emit("typing", {
        senderId: userId,
        chatId,
      });
    });

    socket.on("stop-typing", ({ receiverId, chatId }) => {
      if (!receiverId || !chatId) {
        return;
      }

      io.to(getUserRoom(receiverId)).emit("stop-typing", {
        senderId: userId,
        chatId,
      });
    });

    socket.on("message-seen", async ({ messageId, senderId }) => {
      if (!messageId || !senderId) {
        return;
      }

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiver: userId,
        },
        {
          $set: { status: "seen" },
        },
        {
          returnDocument: 'after',
        },
      ).select("_id");

      if (message) {
        io.to(getUserRoom(senderId)).emit("message-seen", { messageId });
      }
    });

    socket.on("disconnect", async () => {
      const remainingConnections = removeSocketForUser(userId, socket.id);

      if (remainingConnections === 0) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        socket.broadcast.emit("user-offline", userId);
      }
    });
  });
};

export default socketHandler;
