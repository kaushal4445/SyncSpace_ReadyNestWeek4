const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["mention", "meeting_reminder", "file_upload", "workspace_invite", "document_shared", "general"],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    relatedWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
