const express = require("express");
const { body } = require("express-validator");
const {
  getWorkspaceDocuments,
  getRecentDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  updateShareRole,
  removeShareAccess,
  getVersionHistory,
  restoreVersion,
} = require("../controllers/documentController");
const { exportDocumentPdf } = require("../controllers/documentExportController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.use(protect);

router.get("/recent", getRecentDocuments);
router.get("/workspace/:workspaceId", requireWorkspaceMember, getWorkspaceDocuments);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("workspace").notEmpty().withMessage("Workspace is required"),
  ],
  validateRequest,
  requireWorkspaceMember,
  createDocument
);

router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);
router.post("/:id/share", shareDocument);
router.put("/:id/share/:userId", updateShareRole);
router.delete("/:id/share/:userId", removeShareAccess);
router.get("/:id/versions", getVersionHistory);
router.post("/:id/versions/:versionId/restore", restoreVersion);
router.get("/:id/export-pdf", exportDocumentPdf);

module.exports = router;
