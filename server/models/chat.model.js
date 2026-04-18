import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    participantKey: {
      type: String,
      trim: true,
      default: null,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1, updatedAt: -1 });
chatSchema.index(
  { participantKey: 1 },
  {
    unique: true,
    sparse: true,
  },
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
