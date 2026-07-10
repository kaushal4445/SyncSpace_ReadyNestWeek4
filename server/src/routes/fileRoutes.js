const express = require("express");
const { uploadFiles, getWorkspaceFiles, deleteFile, getStorageStats } = require("../controllers/fileController");
const { upload } = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);

router.get("/workspace/:workspaceId", requireWorkspaceMember, getWorkspaceFiles);
router.get("/workspace/:workspaceId/stats", requireWorkspaceMember, getStorageStats);
router.post("/chat", upload.array("files", 10), uploadFiles);
router.post("/workspace/:workspaceId", requireWorkspaceMember, upload.array("files", 10), uploadFiles);
router.delete("/:id", deleteFile);

module.exports = router;
