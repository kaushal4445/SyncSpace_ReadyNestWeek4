const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const ApiFeatures = require("../utils/apiFeatures");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc   Get paginated message history for a workspace channel (infinite scroll)
// @route  GET /api/messages/workspace/:workspaceId
const getWorkspaceMessages = async (req, res, next) => {
  try {
    if (!isValidId(req.params.workspaceId)) {
      return res.status(400).json({ success: false, message: "Invalid workspace id" });
    }

    const base = Message.find({ workspace: req.params.workspaceId, chatType: "workspace" });
    const features = new ApiFeatures(base, req.query).sort("-createdAt").paginate(30);

    const messages = await features.query.populate("sender", "name avatar").populate("documentShare", "title");
    res.status(200).json({ success: true, messages: messages.reverse(), pagination: features.pagination });
  } catch (error) {
    next(error);
  }
};

// @desc   Get paginated private message history between the logged-in user and another user
// @route  GET /api/messages/private/:userId
const getPrivateMessages = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    if (!isValidId(otherUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const base = Message.find({
      chatType: "private",
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id },
      ],
    });

    const features = new ApiFeatures(base, req.query).sort("-createdAt").paginate(30);
    const messages = await features.query.populate("sender", "name avatar").populate("documentShare", "title");

    res.status(200).json({ success: true, messages: messages.reverse(), pagination: features.pagination });
  } catch (error) {
    next(error);
  }
};

// @desc   List the logged-in user's private conversations, sorted by most recent message
// @route  GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      { $match: { chatType: "private", $or: [{ sender: userId }, { recipient: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $ne: ["$sender", userId] }, { $not: { $in: [userId, "$seenBy"] } }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const withUsers = await User.populate(conversations, { path: "_id", select: "name avatar isOnline lastSeen" });

    res.status(200).json({
      success: true,
      conversations: withUsers.map((c) => ({
        user: c._id,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Search messages by content within a workspace
// @route  GET /api/messages/search?workspace=&q=
const searchMessages = async (req, res, next) => {
  try {
    const { workspace, q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter q is required" });
    }

    const filter = { content: new RegExp(q, "i") };
    if (workspace) filter.workspace = workspace;

    const messages = await Message.find(filter).sort("-createdAt").limit(50).populate("sender", "name avatar");

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

// @desc   Get total unread message count for the logged-in user (for a badge in the UI)
// @route  GET /api/messages/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      seenBy: { $ne: req.user._id },
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaceMessages,
  getPrivateMessages,
  getConversations,
  searchMessages,
  getUnreadCount,
};
