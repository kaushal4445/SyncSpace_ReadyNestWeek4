const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Each entry grants a specific user a role on the document. The owner
    // (createdBy) always has full access and is never stored here.
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["editor", "viewer"], default: "viewer" },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
    isPublic: { type: Boolean, default: false },
    versionHistory: [
      {
        content: String,
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        editedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
