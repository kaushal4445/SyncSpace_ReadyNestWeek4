const Notification = require("../models/Notification");
const Workspace = require("../models/Workspace");
const User = require("../models/User");

// @desc   Get notifications for the logged-in user (paginated, newest first)
// @route  GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name avatar");

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark a single notification as read
// @route  PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a notification
// @route  DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

const respondToWorkspaceInvite = async (req, res, next) => {
  try {
    const action = (req.body?.action || "reject").toLowerCase();
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      type: "workspace_invite",
    }).populate("sender", "name avatar");

    if (!notification) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    const workspace = await Workspace.findById(notification.relatedWorkspace);
    if (!workspace) {
      await Notification.findByIdAndDelete(notification._id);
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    if (action === "accept") {
      const alreadyMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
      if (!alreadyMember) {
        workspace.members.push({ user: req.user._id, role: "member" });
        await workspace.save();
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { workspaces: workspace._id } });
      }

      const inviterNotification = await Notification.create({
        recipient: notification.sender?._id,
        sender: req.user._id,
        type: "general",
        message: `${req.user.name || "A member"} accepted your invitation to join ${workspace.name}.`,
        link: `/workspaces/${workspace._id}`,
        relatedWorkspace: workspace._id,
      });
      const populatedInviterNotification = await inviterNotification.populate("sender", "name avatar");
      req.app.get("io")?.to(`user_${notification.sender?._id}`).emit("receive_notification", populatedInviterNotification);
    } else {
      const inviterNotification = await Notification.create({
        recipient: notification.sender?._id,
        sender: req.user._id,
        type: "general",
        message: `${req.user.name || "A member"} declined your invitation to join ${workspace.name}.`,
        link: `/workspaces/${workspace._id}`,
        relatedWorkspace: workspace._id,
      });
      const populatedInviterNotification = await inviterNotification.populate("sender", "name avatar");
      req.app.get("io")?.to(`user_${notification.sender?._id}`).emit("receive_notification", populatedInviterNotification);
    }

    await Notification.findByIdAndDelete(notification._id);

    res.status(200).json({
      success: true,
      message: action === "accept" ? "Invitation accepted" : "Invitation declined",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  respondToWorkspaceInvite,
};
