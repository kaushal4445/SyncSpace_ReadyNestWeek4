const express = require("express");
const {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  updateWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  inviteMember,
  removeMember,
  changeMemberRole,
} = require("../controllers/workspaceController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember, requireWorkspaceAdmin } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);

router.route("/").get(getWorkspaces).post(createWorkspace);
router.post("/join", joinWorkspace);
router.put("/:id", requireWorkspaceMember, requireWorkspaceAdmin, updateWorkspace);
router.delete("/:id", requireWorkspaceMember, requireWorkspaceAdmin, deleteWorkspace);
router.post("/:id/leave", requireWorkspaceMember, leaveWorkspace);
router.post("/:id/invite", requireWorkspaceMember, requireWorkspaceAdmin, inviteMember);
router.delete("/:id/members/:userId", requireWorkspaceMember, requireWorkspaceAdmin, removeMember);
router.put("/:id/members/:userId/role", requireWorkspaceMember, requireWorkspaceAdmin, changeMemberRole);

module.exports = router;
