const path = require("path");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const File = require("../models/File");
const Notification = require("../models/Notification");
const ApiFeatures = require("../utils/apiFeatures");
const { classifyFileType } = require("../middleware/uploadMiddleware");

// Cloudinary needs an explicit resource_type per upload. "auto" is unreliable
// for documents — it frequently stores PDFs under the "image" delivery type,
// which Cloudinary blocks by default ("Failed to load PDF document"). Images
// and videos should still use their dedicated types; everything else
// (PDF, DOCX, PPT, XLSX, ZIP, TXT, etc.) must use "raw" so it's delivered as
// the original file bytes with no transformation/restriction applied.
const getCloudinaryResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw";
};

// Cloudinary docs: "the public IDs of image and video files do not include
// the file's extension, [but] public IDs of raw files must include the
// original file's extension." We upload from an in-memory Buffer (via
// streamifier), so Cloudinary never sees the original filename and — for
// "raw" uploads specifically — generates a public_id with NO extension at
// all. The bytes are still a valid PDF/DOCX/etc, but the delivered URL (and
// therefore the downloaded file) has no extension, so OS/browsers can't
// recognize or open it correctly. Only "raw" needs this; image/video derive
// their extension from separate Cloudinary "format" metadata and must NOT
// have an extension baked into their public_id (doing so would double it,
// e.g. "photo.jpg" -> delivered as "photo.jpg.jpg").
const buildRawPublicId = (originalName) => {
  const ext = path.extname(originalName); // e.g. ".pdf" (includes the dot)
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${base || "file"}-${unique}${ext}`;
};

// Streams a Multer memory buffer up to Cloudinary and resolves with the upload result
const streamUpload = (buffer, folder, resourceType, publicId) =>
  new Promise((resolve, reject) => {
    const options = { folder, resource_type: resourceType };
    if (publicId) options.public_id = publicId;
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

const getUploadContext = (req) => {
  const chatType = req.body?.chatType === "private" ? "private" : "workspace";
  const recipientId = req.body?.recipientId;

  if (chatType === "private") {
    return {
      chatType,
      workspace: null,
      recipient: recipientId || null,
      folder: recipientId ? `syncspace/private/${recipientId}` : "syncspace/private",
    };
  }

  return {
    chatType: "workspace",
    workspace: req.params.workspaceId || null,
    recipient: null,
    folder: req.params.workspaceId ? `syncspace/${req.params.workspaceId}` : "syncspace/attachments",
  };
};

// @desc   Upload one or more files to a workspace or personal chat
// @route  POST /api/files/workspace/:workspaceId or POST /api/files/chat
const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files were uploaded" });
    }

    const { category } = req.body;
    const uploadContext = getUploadContext(req);
    if (uploadContext.chatType === "private" && !uploadContext.recipient) {
      return res.status(400).json({ success: false, message: "A recipient is required for private chat uploads" });
    }

    const uploaded = [];

    for (const file of req.files) {
      const resourceType = getCloudinaryResourceType(file.mimetype);
      const publicId = resourceType === "raw" ? buildRawPublicId(file.originalname) : undefined;
      const result = await streamUpload(file.buffer, uploadContext.folder, resourceType, publicId);

      const savedFile = await File.create({
        fileName: result.public_id,
        originalName: file.originalname,
        url: result.secure_url,
        cloudinaryId: result.public_id,
        resourceType,
        fileType: classifyFileType(file.mimetype),
        fileSize: file.size,
        category: category || "general",
        chatType: uploadContext.chatType,
        workspace: uploadContext.chatType === "workspace" ? uploadContext.workspace : null,
        recipient: uploadContext.chatType === "private" ? uploadContext.recipient : null,
        sender: req.user._id,
        uploadedBy: req.user._id,
      });

      uploaded.push(savedFile);
    }

    if (uploadContext.chatType === "workspace") {
      await Notification.create({
        recipient: req.user._id,
        sender: req.user._id,
        type: "file_upload",
        message: `${uploaded.length} file(s) uploaded to workspace`,
        relatedWorkspace: uploadContext.workspace,
      });
    }

    res.status(201).json({ success: true, files: uploaded });
  } catch (error) {
    next(error);
  }
};

// @desc   List files in a workspace (supports ?category=&fileType=&search=&page=&limit=)
// @route  GET /api/files/workspace/:workspaceId
const getWorkspaceFiles = async (req, res, next) => {
  try {
    const base = File.find({ workspace: req.params.workspaceId });

    const features = new ApiFeatures(base, req.query)
      .search(["originalName"])
      .filter(["category", "fileType"])
      .sort("-createdAt")
      .paginate(24);

    const files = await features.query.populate("uploadedBy", "name avatar");
    const total = await File.countDocuments({ workspace: req.params.workspaceId });

    res.status(200).json({ success: true, count: files.length, total, pagination: features.pagination, files });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a file (removes from Cloudinary + DB)
// @route  DELETE /api/files/:id
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Old records created before this field existed default to "raw" via the
    // schema default, which matches how documents were being stored anyway.
    await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: file.resourceType || "raw" });
    await file.deleteOne();

    res.status(200).json({ success: true, message: "File deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc   Storage usage statistics for a workspace, grouped by category/fileType
// @route  GET /api/files/workspace/:workspaceId/stats
const getStorageStats = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;

    const [totals, byType] = await Promise.all([
      File.aggregate([
        { $match: { workspace: new (require("mongoose").Types.ObjectId)(workspaceId) } },
        { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: "$fileSize" } } },
      ]),
      File.aggregate([
        { $match: { workspace: new (require("mongoose").Types.ObjectId)(workspaceId) } },
        { $group: { _id: "$fileType", count: { $sum: 1 }, size: { $sum: "$fileSize" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      totalFiles: totals[0]?.totalFiles || 0,
      totalSize: totals[0]?.totalSize || 0,
      byType,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFiles, getWorkspaceFiles, deleteFile, getStorageStats };