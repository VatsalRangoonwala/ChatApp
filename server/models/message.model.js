import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
    },

    image: {
      type: String,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen", "scheduled"],
      default: "sent",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1, deleted: 1, isScheduled: 1 });
messageSchema.index({ sender: 1, isScheduled: 1, scheduledAt: 1 });
messageSchema.index({ isScheduled: 1, scheduledAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
