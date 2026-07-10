const multer = require("multer");
const path = require("path");

// Memory storage so buffers can be streamed straight to Cloudinary (no local disk writes)
const storage = multer.memoryStorage();

const allowedExtensions = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", // images
  ".pdf", // pdfs
  ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", // documents
  ".mp4", ".mov", ".avi", ".webm", // video
  ".zip", ".rar", ".7z", // archives
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Classifies a mimetype into the File model's fileType enum
const classifyFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.startsWith("video/")) return "video";
  if (
    mimetype.includes("word") ||
    mimetype.includes("excel") ||
    mimetype.includes("powerpoint") ||
    mimetype === "text/plain"
  ) {
    return "document";
  }
  if (
    mimetype.includes("zip") ||
    mimetype.includes("compressed") ||
    mimetype.includes("rar") ||
    mimetype === "application/x-7z-compressed"
  ) {
    return "archive";
  }
  return "other";
};

module.exports = { upload, classifyFileType };
