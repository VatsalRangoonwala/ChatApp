import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  const { chatId, text, receiverId } = req.body;

  if (!chatId || !receiverId || !text) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    let message = await Message.create({
      chatId,
      sender: req.user._id,
      receiver: receiverId,
      text,
    });

    // Update last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    message = await message.populate("sender", "name email");
    message = await message.populate("receiver", "name email");

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

  res.json(updated);
};

export const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  message.text = "This message was deleted";
  message.deleted = true;

  await message.save();

  res.json(message);
};

// FETCH MESSAGES WITH PAGINATION
export const fetchMessages = async (req, res) => {
  const { chatId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = 20;

  try {
    const messages = await Message.find({ chatId })
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
