const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    // Cloudinary requires the exact resource_type ("image" | "video" | "raw")
    // used at upload time to correctly delete a file later — "auto" is only
    // valid for uploads, not for uploader.destroy().
    resourceType: { type: String, enum: ["image", "video", "raw"], default: "raw" },
    fileType: { type: String, enum: ["image", "pdf", "document", "video", "archive", "other"], required: true },
    fileSize: { type: Number, required: true },
    category: { type: String, default: "general" },
    chatType: { type: String, enum: ["private", "workspace"], default: "workspace" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);