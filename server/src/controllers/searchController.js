const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Document = require("../models/Document");
const File = require("../models/File");
const Meeting = require("../models/Meeting");
const Message = require("../models/Message");

// @desc   Global search across users, workspaces, documents, files, meetings, and messages
// @route  GET /api/search?q=&types=users,workspaces,documents,files,meetings,messages
const globalSearch = async (req, res, next) => {
  try {
    const { q, types } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Query must be at least 2 characters" });
    }

    const regex = new RegExp(q, "i");
    const requestedTypes = types ? types.split(",") : ["users", "workspaces", "documents", "files", "meetings", "messages"];
    const userWorkspaceIds = req.user.workspaces;

    const results = {};

    if (requestedTypes.includes("users")) {
      results.users = await User.find({
        _id: { $ne: req.user._id },
        $or: [{ name: regex }, { email: regex }],
      })
        .select("name email avatar role workspaces isOnline")
        .limit(10);
    }

    if (requestedTypes.includes("workspaces")) {
      results.workspaces = await Workspace.find({
        name: regex,
        "members.user": req.user._id,
      })
        .select("name description workspaceImage")
        .limit(10);
    }

    if (requestedTypes.includes("documents")) {
      results.documents = await Document.find({
        title: regex,
        workspace: { $in: userWorkspaceIds },
      })
        .select("title workspace updatedAt")
        .limit(10);
    }

    if (requestedTypes.includes("files")) {
      results.files = await File.find({
        originalName: regex,
        workspace: { $in: userWorkspaceIds },
      })
        .select("originalName fileType url")
        .limit(10);
    }

    if (requestedTypes.includes("meetings")) {
      results.meetings = await Meeting.find({
        title: regex,
        workspace: { $in: userWorkspaceIds },
      })
        .select("title scheduledStart status")
        .limit(10);
    }

    if (requestedTypes.includes("messages")) {
      results.messages = await Message.find({
        content: regex,
        $or: [{ sender: req.user._id }, { recipient: req.user._id }, { workspace: { $in: userWorkspaceIds } }],
      })
        .select("content sender createdAt")
        .limit(10);
    }

    res.status(200).json({ success: true, query: q, results });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
