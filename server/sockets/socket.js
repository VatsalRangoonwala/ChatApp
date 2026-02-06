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
