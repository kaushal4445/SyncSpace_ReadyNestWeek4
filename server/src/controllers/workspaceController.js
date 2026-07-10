const crypto = require("crypto");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc   Get all workspaces for logged-in user
// @route  GET /api/workspaces
const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user._id })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");
    res.status(200).json({ success: true, count: workspaces.length, workspaces });
  } catch (error) {
    next(error);
  }
};

// @desc   Create workspace
// @route  POST /api/workspaces
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, isPublic, workspaceImage } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Workspace name is required" });
    }
    const inviteCode = crypto.randomBytes(6).toString("hex");

    const workspace = await Workspace.create({
      name: name.trim(),
      description,
      workspaceImage,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
      inviteCode,
      settings: { isPublic: !!isPublic, allowMemberInvites: true },
    });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { workspaces: workspace._id } });

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(201).json({ success: true, workspace: populated });
  } catch (error) {
    next(error);
  }
};

// @desc   Join a workspace using its invite code
// @route  POST /api/workspaces/join
const joinWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ success: false, message: "Invite code is required" });
    }

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.trim() });
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Invalid invite code" });
    }

    const alreadyMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      workspace.members.push({ user: req.user._id, role: "member" });
      await workspace.save();
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { workspaces: workspace._id } });
    }

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(200).json({ success: true, workspace: populated });
  } catch (error) {
    next(error);
  }
};

// @desc   Update workspace
// @route  PUT /api/workspaces/:id
const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const { name, description, workspaceImage, settings } = req.body;
    if (name !== undefined) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description;
    if (workspaceImage !== undefined) workspace.workspaceImage = workspaceImage;
    if (settings !== undefined) workspace.settings = { ...workspace.settings.toObject(), ...settings };

    await workspace.save();

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(200).json({ success: true, workspace: populated });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete workspace
// @route  DELETE /api/workspaces/:id
const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const memberIds = workspace.members.map((m) => m.user);
    await User.updateMany({ _id: { $in: memberIds } }, { $pull: { workspaces: workspace._id } });
    await workspace.deleteOne();

    res.status(200).json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc   Current user leaves a workspace (owner cannot leave; must delete or transfer instead)
// @route  POST /api/workspaces/:id/leave
const leaveWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    if (workspace.owner.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Owners cannot leave their own workspace. Delete it instead." });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== req.user._id.toString());
    await workspace.save();
    await User.findByIdAndUpdate(req.user._id, { $pull: { workspaces: workspace._id } });

    res.status(200).json({ success: true, message: "Left workspace" });
  } catch (error) {
    next(error);
  }
};

// @desc   Change a member's role within a workspace
// @route  PUT /api/workspaces/:id/members/:userId/role
const changeMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'admin' or 'member'" });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const membership = workspace.members.find((m) => m.user.toString() === req.params.userId);
    if (!membership) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    membership.role = role;
    await workspace.save();

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(200).json({ success: true, workspace: populated });
  } catch (error) {
    next(error);
  }
};

// @desc   Invite member to workspace
// @route  POST /api/workspaces/:id/invite
const inviteMember = async (req, res, next) => {
  try {
    const { userId, email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const alreadyMember = workspace.members.some((m) => m.user.toString() === targetUser._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: "User already a member" });
    }

    const pendingInvite = await Notification.findOne({
      recipient: targetUser._id,
      type: "workspace_invite",
      relatedWorkspace: workspace._id,
      isRead: false,
    });
    if (pendingInvite) {
      return res.status(400).json({ success: false, message: "Invitation already pending" });
    }

    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: "workspace_invite",
      message: `${req.user.name || "Someone"} invited you to join ${workspace.name}.`,
      link: `/workspaces/${workspace._id}`,
      relatedWorkspace: workspace._id,
    });

    const populatedNotification = await notification.populate("sender", "name avatar");
    req.app.get("io")?.to(`user_${targetUser._id}`).emit("receive_notification", populatedNotification);

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(200).json({ success: true, workspace: populated, pendingInvite: true });
  } catch (error) {
    next(error);
  }
};

// @desc   Remove member from workspace
// @route  DELETE /api/workspaces/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await workspace.save();
    await User.findByIdAndUpdate(req.params.userId, { $pull: { workspaces: workspace._id } });

    const populated = await Workspace.findById(workspace._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar isOnline");

    res.status(200).json({ success: true, workspace: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  updateWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  inviteMember,
  removeMember,
  changeMemberRole,
};
