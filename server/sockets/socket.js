import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const onlineUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit("user-online", userId);

    // ✅ mark pending messages as delivered
    const undeliveredMessages = await Message.find({
      receiver: userId,
      status: "sent",
    });

    for (const msg of undeliveredMessages) {
      msg.status = "delivered";
      await msg.save();

      // notify sender if online
      const senderSocketId = onlineUsers.get(msg.sender.toString());

      if (senderSocketId) {
        io.to(senderSocketId).emit("message-delivered", {
          messageId: msg._id,
        });
      }
    }

    console.log("User connected:", userId);

    //  PRIVATE MESSAGE
    socket.on("send-message", async (data) => {
      const { receiverId, message } = data;

      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", message);

        await Message.findByIdAndUpdate(message._id, {
          status: "delivered",
        });

        io.to(socket.id).emit("message-delivered", {
          messageId: message._id,
        });
      }
    });

    //  TYPING
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing");
      }
    });

    socket.on("stop-typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop-typing");
      }
    });

    //UPDATE AND DELETE
    socket.on("message-updated", (message) => {
      io.to(message.chatId).emit("message-updated", message);
    });

    socket.on("message-deleted", (message) => {
      io.to(message.chatId).emit("message-deleted", message);
    });

    //  SEEN
    socket.on("message-seen", async ({ messageId, senderId }) => {
      await Message.findByIdAndUpdate(messageId, {
        status: "seen",
      });

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-seen", { messageId });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      socket.broadcast.emit("user-offline", userId);
      console.log("User disconnected:", userId);
    });
  });
};

export default socketHandler;
