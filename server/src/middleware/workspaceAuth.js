const Workspace = require("../models/Workspace");

// Attaches req.workspaceMember (the caller's membership record) and enforces
// that the caller belongs to the workspace referenced by req.params.id / req.body.workspace.
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspace;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace reference is required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const membership = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!membership) {
      return res.status(403).json({ success: false, message: "You are not a member of this workspace" });
    }

    req.workspace = workspace;
    req.workspaceRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

// Use after requireWorkspaceMember to restrict an action to workspace admins/owner.
const requireWorkspaceAdmin = (req, res, next) => {
  const isOwner = req.workspace.owner.toString() === req.user._id.toString();
  const isAdmin = req.workspaceRole === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: "Admin privileges required for this action" });
  }
  next();
};

module.exports = { requireWorkspaceMember, requireWorkspaceAdmin };
