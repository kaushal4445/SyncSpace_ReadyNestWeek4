const express = require("express");
const {
  getWorkspaceMessages,
  getPrivateMessages,
  getConversations,
  searchMessages,
  getUnreadCount,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/search", searchMessages);
router.get("/workspace/:workspaceId", requireWorkspaceMember, getWorkspaceMessages);
router.get("/private/:userId", getPrivateMessages);

module.exports = router;
