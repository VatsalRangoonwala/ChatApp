import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// Create or Get One-to-One Chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

  try {
    let chat = await Chat.findOne({
      participants: {
        $all: [req.user._id, userId],
      },
    }).populate("participants", "-password");

    if (chat) {
      return res.json(chat);
    }

    const newChat = await Chat.create({
      participants: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "participants",
      "-password",
    );

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch User Chats
export const fetchChats = async (req, res) => {
  try {
    const unread = await Message.countDocuments({
      $and: [
        { receiver: req.user._id },
        { $or: [{ status: "sent" }, { status: "delivered" }] },
      ],
    });
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json({chats, unread});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
