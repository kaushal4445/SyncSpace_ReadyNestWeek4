const Document = require("../models/Document");
const ApiFeatures = require("../utils/apiFeatures");
const { mergeDocumentContent } = require("../utils/documentCollaboration");

// @desc   Get all documents in a workspace (supports ?search=&tag=&page=&limit=&sort=)
// @route  GET /api/documents/workspace/:workspaceId
const getWorkspaceDocuments = async (req, res, next) => {
  try {
    const base = Document.find({ workspace: req.params.workspaceId });

    const features = new ApiFeatures(base, req.query)
      .search(["title", "content"])
      .filter(["tags"])
      .sort("-updatedAt")
      .paginate(20);

    const documents = await features.query
      .populate("createdBy", "name avatar")
      .populate("lastEditedBy", "name avatar");

    const total = await Document.countDocuments({ workspace: req.params.workspaceId });

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      pagination: features.pagination,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get recent documents for the logged-in user across all their workspaces
// @route  GET /api/documents/recent
const getRecentDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({
      $or: [{ createdBy: req.user._id }, { "sharedWith.user": req.user._id }],
    })
      .sort("-updatedAt")
      .limit(10)
      .populate("workspace", "name")
      .populate("createdBy", "name avatar");

    res.status(200).json({ success: true, documents });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single document
// @route  GET /api/documents/:id
const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("createdBy", "name avatar email")
      .populate("lastEditedBy", "name avatar")
      .populate("sharedWith.user", "name avatar email");

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

// @desc   Create document
// @route  POST /api/documents
const createDocument = async (req, res, next) => {
  try {
    const { title, content, workspace, tags } = req.body;

    const document = await Document.create({
      title,
      content: content || "",
      workspace,
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
      tags: tags || [],
    });

    res.status(201).json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

// @desc   Update document content/title/tags (pushes previous content into versionHistory)
// @route  PUT /api/documents/:id
const updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const { title, content, tags, baseContent } = req.body;

    if (typeof content === "string" && content !== document.content) {
      const mergedContent = mergeDocumentContent(document.content, content, baseContent || document.content);
      document.versionHistory.push({
        content: document.content,
        editedBy: document.lastEditedBy,
        editedAt: document.updatedAt,
      });
      document.content = mergedContent;
    }

    if (title) document.title = title;
    if (tags) document.tags = tags;
    document.lastEditedBy = req.user._id;

    await document.save();
    res.status(200).json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete document
// @route  DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await document.deleteOne();
    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

// Only the document owner or an existing editor may manage sharing.
const canManageSharing = (document, userId) => {
  const uid = userId.toString();
  if (document.createdBy.toString() === uid) return true;
  const entry = document.sharedWith.find((s) => s.user.toString() === uid);
  return entry?.role === "editor";
};

// @desc   Share a document with a specific user by id (grants editor/viewer role),
//         and/or toggle public link access.
// @route  POST /api/documents/:id/share
// @body   { userId, role, isPublic }
const shareDocument = async (req, res, next) => {
  try {
    const { userId, role, isPublic } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (!canManageSharing(document, req.user._id)) {
      return res.status(403).json({ success: false, message: "You don't have permission to share this document" });
    }

    if (userId) {
      const User = require("../models/User");
      const Workspace = require("../models/Workspace");

      const targetUser = await User.findById(userId).select("name avatar email");
      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // The target must belong to the same workspace as the document.
      const workspace = await Workspace.findById(document.workspace).select("members");
      const isMember = workspace?.members.some((m) => m.user.toString() === userId);
      if (!isMember) {
        return res.status(400).json({ success: false, message: "User is not a member of this workspace" });
      }

      if (targetUser._id.toString() === document.createdBy.toString()) {
        return res.status(400).json({ success: false, message: "That user already owns this document" });
      }

      const existing = document.sharedWith.find((s) => s.user.toString() === userId);
      if (existing) {
        existing.role = role === "editor" ? "editor" : "viewer";
      } else {
        document.sharedWith.push({ user: userId, role: role === "editor" ? "editor" : "viewer" });
      }

      await document.save();

      // Notify the recipient — both a persisted Notification and, if
      // they're online, a real-time Socket.IO push to their personal room.
      const Notification = require("../models/Notification");
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: "document_shared",
        message: `${req.user.name} shared "${document.title}" with you`,
        link: `/documents/${document._id}`,
        relatedWorkspace: document.workspace,
      });

      const io = req.app.get("io");
      if (io) {
        const populatedNotification = await notification.populate("sender", "name avatar");
        io.to(`user_${userId}`).emit("receive_notification", populatedNotification);
      }
    }

    if (typeof isPublic === "boolean") {
      document.isPublic = isPublic;
    }

    await document.save();

    const updated = await Document.findById(document._id)
      .populate("createdBy", "name avatar email")
      .populate("sharedWith.user", "name avatar email");

    res.status(200).json({ success: true, document: updated });
  } catch (error) {
    next(error);
  }
};

// @desc   Change an existing collaborator's role (editor <-> viewer)
// @route  PUT /api/documents/:id/share/:userId
const updateShareRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'editor' or 'viewer'" });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (!canManageSharing(document, req.user._id)) {
      return res.status(403).json({ success: false, message: "You don't have permission to manage sharing" });
    }

    const entry = document.sharedWith.find((s) => s.user.toString() === req.params.userId);
    if (!entry) {
      return res.status(404).json({ success: false, message: "This user doesn't have access" });
    }
    entry.role = role;
    await document.save();

    const updated = await Document.findById(document._id).populate("sharedWith.user", "name avatar email");
    res.status(200).json({ success: true, document: updated });
  } catch (error) {
    next(error);
  }
};

// @desc   Revoke a collaborator's access
// @route  DELETE /api/documents/:id/share/:userId
const removeShareAccess = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (!canManageSharing(document, req.user._id)) {
      return res.status(403).json({ success: false, message: "You don't have permission to manage sharing" });
    }

    document.sharedWith = document.sharedWith.filter((s) => s.user.toString() !== req.params.userId);
    await document.save();

    const updated = await Document.findById(document._id).populate("sharedWith.user", "name avatar email");
    res.status(200).json({ success: true, document: updated });
  } catch (error) {
    next(error);
  }
};

// @desc   Get version history for a document
// @route  GET /api/documents/:id/versions
const getVersionHistory = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .select("versionHistory title")
      .populate("versionHistory.editedBy", "name avatar");

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, title: document.title, versionHistory: document.versionHistory });
  } catch (error) {
    next(error);
  }
};

// @desc   Restore a previous version as the current content
// @route  POST /api/documents/:id/versions/:versionId/restore
const restoreVersion = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const version = document.versionHistory.id(req.params.versionId);
    if (!version) {
      return res.status(404).json({ success: false, message: "Version not found" });
    }

    document.versionHistory.push({
      content: document.content,
      editedBy: req.user._id,
      editedAt: Date.now(),
    });
    document.content = version.content;
    document.lastEditedBy = req.user._id;

    await document.save();
    res.status(200).json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
