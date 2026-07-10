const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chatType: { type: String, enum: ["private", "workspace", "group"], required: true },
    groupId: { type: String },
    content: { type: String, trim: true },
    attachments: [
      {
        url: String,
        fileType: String,
        fileName: String,
        fileSize: Number,
      },
    ],
    // Lets a user share a document directly into a conversation (see chat
    // "attach > Documents" flow). Populated with { title } for the preview
    // card; the recipient follows documentShare._id to open the editor.
    documentShare: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Supports infinite-scroll pagination and conversation lookups efficiently.
messageSchema.index({ workspace: 1, chatType: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
