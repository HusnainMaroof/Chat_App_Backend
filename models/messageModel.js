import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    text: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
  },
  status: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: null,
  },
});

// Indexing for faster history lookups
messageSchema.index({ senderId: 1, recipientId: 1 });

export const MessageModel = mongoose.model("Message", messageSchema);
