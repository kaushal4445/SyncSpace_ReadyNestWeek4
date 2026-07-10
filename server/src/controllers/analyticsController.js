const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const Document = require("../models/Document");
const File = require("../models/File");
const Meeting = require("../models/Meeting");
const Message = require("../models/Message");
const User = require("../models/User");

const oid = (id) => new mongoose.Types.ObjectId(id);

// @desc   High-level dashboard stat cards for a workspace
// @route  GET /api/analytics/workspace/:workspaceId/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const [totalDocuments, totalFiles, totalMeetings, onlineMembersCount] = await Promise.all([
      Document.countDocuments({ workspace: workspaceId }),
      File.countDocuments({ workspace: workspaceId }),
      Meeting.countDocuments({ workspace: workspaceId }),
      User.countDocuments({ _id: { $in: workspace.members.map((m) => m.user) }, isOnline: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalDocuments,
        totalFiles,
        totalMeetings,
        activeMembers: workspace.members.length,
        onlineMembers: onlineMembersCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Workspace growth: members joined per month (line chart)
// @route  GET /api/analytics/workspace/:workspaceId/growth
const getWorkspaceGrowth = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const growth = {};
    workspace.members.forEach((m) => {
      const key = new Date(m.joinedAt).toISOString().slice(0, 7); // YYYY-MM
      growth[key] = (growth[key] || 0) + 1;
    });

    const series = Object.entries(growth)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, count]) => ({ month, count }));

    res.status(200).json({ success: true, series });
  } catch (error) {
    next(error);
  }
};

// @desc   Chat statistics: messages sent per day, last 14 days (bar chart)
// @route  GET /api/analytics/workspace/:workspaceId/chat-stats
const getChatStats = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const series = await Message.aggregate([
      { $match: { workspace: oid(req.params.workspaceId), createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, series: series.map((s) => ({ date: s._id, count: s.count })) });
  } catch (error) {
    next(error);
  }
};

// @desc   Meeting statistics grouped by status (pie chart)
// @route  GET /api/analytics/workspace/:workspaceId/meeting-stats
const getMeetingStats = async (req, res, next) => {
  try {
    const series = await Meeting.aggregate([
      { $match: { workspace: oid(req.params.workspaceId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({ success: true, series: series.map((s) => ({ status: s._id, count: s.count })) });
  } catch (error) {
    next(error);
  }
};

// @desc   Storage usage breakdown by file type (pie chart) — reuses File model
// @route  GET /api/analytics/workspace/:workspaceId/storage
const getStorageUsage = async (req, res, next) => {
  try {
    const series = await File.aggregate([
      { $match: { workspace: oid(req.params.workspaceId) } },
      { $group: { _id: "$fileType", size: { $sum: "$fileSize" }, count: { $sum: 1 } } },
    ]);

    res.status(200).json({ success: true, series: series.map((s) => ({ type: s._id, size: s.size, count: s.count })) });
  } catch (error) {
    next(error);
  }
};

// @desc   Team/user activity: documents edited + messages sent per member (bar chart)
// @route  GET /api/analytics/workspace/:workspaceId/team-activity
const getTeamActivity = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;

    const [docActivity, chatActivity] = await Promise.all([
      Document.aggregate([
        { $match: { workspace: oid(workspaceId) } },
        { $group: { _id: "$lastEditedBy", edits: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { workspace: oid(workspaceId) } },
        { $group: { _id: "$sender", messages: { $sum: 1 } } },
      ]),
    ]);

    const combined = {};
    docActivity.forEach((d) => {
      if (!d._id) return;
      combined[d._id] = { edits: d.edits, messages: 0 };
    });
    chatActivity.forEach((c) => {
      if (!c._id) return;
      combined[c._id] = combined[c._id] || { edits: 0, messages: 0 };
      combined[c._id].messages = c.messages;
    });

    const userIds = Object.keys(combined);
    const users = await User.find({ _id: { $in: userIds } }).select("name avatar");

    const result = users.map((u) => ({
      user: { id: u._id, name: u.name, avatar: u.avatar },
      ...combined[u._id.toString()],
    }));

    res.status(200).json({ success: true, activity: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getWorkspaceGrowth,
  getChatStats,
  getMeetingStats,
  getStorageUsage,
  getTeamActivity,
};
