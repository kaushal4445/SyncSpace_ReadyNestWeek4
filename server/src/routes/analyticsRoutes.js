const express = require("express");
const {
  getDashboardStats,
  getWorkspaceGrowth,
  getChatStats,
  getMeetingStats,
  getStorageUsage,
  getTeamActivity,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);
router.use("/workspace/:workspaceId", requireWorkspaceMember);

router.get("/workspace/:workspaceId/dashboard", getDashboardStats);
router.get("/workspace/:workspaceId/growth", getWorkspaceGrowth);
router.get("/workspace/:workspaceId/chat-stats", getChatStats);
router.get("/workspace/:workspaceId/meeting-stats", getMeetingStats);
router.get("/workspace/:workspaceId/storage", getStorageUsage);
router.get("/workspace/:workspaceId/team-activity", getTeamActivity);

module.exports = router;
