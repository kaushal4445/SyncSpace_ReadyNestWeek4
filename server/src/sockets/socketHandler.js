const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Document = require("../models/Document");
const { mergeDocumentContent } = require("../utils/documentCollaboration");

const isValidId = (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

// Tracks socket.id -> userId for online presence
const onlineUsers = new Map();
const documentActivityByDocument = new Map();

const getActivitySnapshot = (documentId) => {
  const activityMap = documentActivityByDocument.get(documentId);
  if (!activityMap) return [];
  return Array.from(activityMap.values()).map(({ userId, userName, status }) => ({
    id: userId,
    name: userName,
    status,
  }));
};

const setDocumentActivity = (documentId, userId, userName, status) => {
  if (!documentId || !userId) return undefined;
  const activityMap = documentActivityByDocument.get(documentId) || new Map();
  if (status === "idle") {
    activityMap.delete(userId);
    if (!activityMap.size) documentActivityByDocument.delete(documentId);
    else documentActivityByDocument.set(documentId, activityMap);
    return activityMap;
  }
  activityMap.set(userId, { userId, userName, status });
  documentActivityByDocument.set(documentId, activityMap);
  return activityMap;
};

const clearDocumentActivity = (documentId, userId) => {
  if (!documentId || !userId) return;
  const activityMap = documentActivityByDocument.get(documentId);
  if (!activityMap) return;
  activityMap.delete(userId);
  if (!activityMap.size) documentActivityByDocument.delete(documentId);
  else documentActivityByDocument.set(documentId, activityMap);
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Every listener is wrapped so a single bad payload (missing field,
    // invalid ObjectId, DB hiccup) can only emit an error back to that
    // socket instead of throwing inside an async callback and crashing the
    // whole Node process (which previously took the REST API down with it —
    // the root cause of the ECONNREFUSED errors on /api/messages/*).
    const safeOn = (event, handler) => {
      socket.on(event, async (...args) => {
        try {
          await handler(...args);
        } catch (error) {
          console.error(`Socket event "${event}" failed:`, error.message);
          socket.emit("socket_error", { event, message: "Something went wrong. Please try again." });
        }
      });
    };

    // Register user as online
    safeOn("user_online", async (userId) => {
      if (!isValidId(userId)) return;
      onlineUsers.set(socket.id, userId);
      socket.join(`user_${userId}`); // personal room, used for targeted notifications
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("online_users", Array.from(new Set(onlineUsers.values())));
    });

    // Join a workspace room (only if the workspace actually exists and the
    // caller is a member — prevents a stale/deleted workspaceId from a
    // dangling client tab silently joining a bogus room forever)
    safeOn("join_workspace", async (workspaceId) => {
      if (!isValidId(workspaceId)) {
        return socket.emit("socket_error", { event: "join_workspace", message: "Invalid workspace" });
      }
      const userId = onlineUsers.get(socket.id);
      const workspace = await Workspace.findById(workspaceId).select("members");
      if (!workspace) {
        return socket.emit("socket_error", { event: "join_workspace", message: "Workspace not found" });
      }
      if (userId && !workspace.members.some((m) => m.user.toString() === userId)) {
        return socket.emit("socket_error", { event: "join_workspace", message: "Not a member of this workspace" });
      }
      socket.join(`workspace_${workspaceId}`);
    });

    // Join a private chat room
    safeOn("join_private", (roomId) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.join(`private_${roomId}`);
    });

    // Leave rooms cleanly when the client switches channels, so a socket
    // doesn't keep accumulating stale room memberships for the session.
    safeOn("leave_workspace", (workspaceId) => {
      if (isValidId(workspaceId)) socket.leave(`workspace_${workspaceId}`);
    });

    safeOn("leave_private", (roomId) => {
      if (roomId) socket.leave(`private_${roomId}`);
    });

    // Send a chat message
    safeOn("send_message", async (data, ack) => {
      const {
        sender,
        recipient,
        workspace,
        chatType,
        content,
        attachments,
        groupId,
        documentShare,
        mentions,
      } = data || {};

      if (!isValidId(sender)) {
        return socket.emit("socket_error", { event: "send_message", message: "Missing or invalid sender" });
      }
      if (!["private", "workspace", "group"].includes(chatType)) {
        return socket.emit("socket_error", { event: "send_message", message: "Invalid chat type" });
      }
      if ((!content || !content.trim()) && !(attachments?.length) && !documentShare) {
        return socket.emit("socket_error", { event: "send_message", message: "Message cannot be empty" });
      }
      if (chatType === "workspace" && !isValidId(workspace)) {
        return socket.emit("socket_error", { event: "send_message", message: "Invalid workspace" });
      }
      if (chatType === "private" && !isValidId(recipient)) {
        return socket.emit("socket_error", { event: "send_message", message: "Invalid recipient" });
      }

      const validMentions = Array.isArray(mentions) ? mentions.filter(isValidId) : [];

      const normalizedWorkspace = chatType === "private" ? undefined : workspace || undefined;
      const message = await Message.create({
        sender,
        recipient: chatType === "private" ? recipient || undefined : undefined,
        workspace: normalizedWorkspace,
        chatType,
        content,
        attachments,
        groupId,
        documentShare: documentShare || undefined,
        mentions: validMentions,
      });

      const populatedMessage = await message.populate([
        { path: "sender", select: "name avatar" },
        { path: "documentShare", select: "title" },
      ]);

      if (chatType === "workspace") {
        io.to(`workspace_${workspace}`).emit("receive_message", populatedMessage);
      } else if (chatType === "private" && groupId) {
        io.to(`private_${groupId}`).emit("receive_message", populatedMessage);
      } else if (chatType === "group" && groupId) {
        io.to(`group_${groupId}`).emit("receive_message", populatedMessage);
      }

      // Fire a mention notification for anyone @mentioned in a workspace message
      if (validMentions.length) {
        const Notification = require("../models/Notification");
        for (const mentionedId of validMentions) {
          if (mentionedId === sender) continue;
          const notification = await Notification.create({
            recipient: mentionedId,
            sender,
            type: "mention",
            message: `${populatedMessage.sender.name} mentioned you in a message`,
            link: workspace ? `/chat?workspace=${workspace}` : "/chat",
            relatedWorkspace: workspace || undefined,
          });
          const populatedNotification = await notification.populate("sender", "name avatar");
          io.to(`user_${mentionedId}`).emit("receive_notification", populatedNotification);
        }
      }

      // Acknowledge back to the sender so the client can reconcile its
      // optimistic (locally-added) message with the real persisted one
      // instead of ending up with a duplicate.
      if (typeof ack === "function") ack({ success: true, message: populatedMessage });
    });

    // Typing indicator
    safeOn("typing", ({ roomId, userName } = {}) => {
      if (!roomId) return;
      socket.to(roomId).emit("user_typing", { userName });
    });

    safeOn("stop_typing", ({ roomId } = {}) => {
      if (!roomId) return;
      socket.to(roomId).emit("user_stop_typing");
    });

    // Mark message(s) as seen
    safeOn("mark_seen", async ({ messageId, userId, roomId } = {}) => {
      if (!isValidId(messageId) || !isValidId(userId)) return;
      await Message.findByIdAndUpdate(messageId, { $addToSet: { seenBy: userId } });
      if (roomId) {
        io.to(roomId).emit("message_seen", { messageId, userId });
      } else {
        io.emit("message_seen", { messageId, userId });
      }
    });

    safeOn("join_document", async ({ documentId, userId, userName }) => {
      if (!isValidId(documentId) || !isValidId(userId)) return;
      const document = await Document.findById(documentId).select("_id workspace title");
      if (!document) return;
      socket.join(`document_${documentId}`);
      socket.data.documentId = documentId;
      socket.data.userId = userId;
      socket.data.userName = userName || "Collaborator";
      socket.to(`document_${documentId}`).emit("document_presence_update", {
        type: "join",
        documentId,
        user: { id: userId, name: userName || "Collaborator" },
      });
      const members = await Promise.all(
        Array.from(io.sockets.adapter.rooms.get(`document_${documentId}`) || []).map(async (socketId) => {
          const memberSocket = io.sockets.sockets.get(socketId);
          return memberSocket?.data?.userId
            ? { id: memberSocket.data.userId, name: memberSocket.data.userName || "Collaborator", online: true }
            : null;
        })
      );
      const uniqueMembers = members.filter(Boolean).filter((member, index, items) => items.findIndex((candidate) => candidate.id === member.id) === index);
      socket.emit("document_presence_snapshot", {
        documentId,
        collaborators: uniqueMembers,
      });
      socket.emit("document_activity_snapshot", {
        documentId,
        activity: getActivitySnapshot(documentId),
      });
    });

    safeOn("leave_document", async ({ documentId } = {}) => {
      if (!isValidId(documentId)) return;
      socket.leave(`document_${documentId}`);
      clearDocumentActivity(documentId, socket.data?.userId);
      socket.to(`document_${documentId}`).emit("document_presence_update", {
        type: "leave",
        documentId,
        user: { id: socket.data.userId, name: socket.data.userName || "Collaborator" },
      });
      socket.to(`document_${documentId}`).emit("document_activity_update", {
        documentId,
        activity: getActivitySnapshot(documentId),
      });
    });

    safeOn("document_cursor", ({ documentId, position, userId, userName }) => {
      if (!isValidId(documentId) || !isValidId(userId)) return;
      socket.to(`document_${documentId}`).emit("document_cursor_update", {
        documentId,
        userId,
        userName,
        position,
      });
    });

    safeOn("document_activity", ({ documentId, userId, userName, status } = {}) => {
      if (!isValidId(documentId) || !isValidId(userId)) return;
      const normalizedStatus = status === "editing" || status === "typing" ? status : "idle";
      setDocumentActivity(documentId, userId, userName || "Collaborator", normalizedStatus);
      const activity = getActivitySnapshot(documentId);
      io.to(`document_${documentId}`).emit("document_activity_update", { documentId, activity });
    });

    safeOn("document_change", async ({ documentId, userId, baseContent, incomingContent, userName } = {}) => {
      if (!isValidId(documentId) || !isValidId(userId)) return;
      const doc = await Document.findById(documentId);
      if (!doc) return;

      const mergedContent = mergeDocumentContent(doc.content, incomingContent, baseContent);
      if (mergedContent === doc.content) return;
      doc.content = mergedContent;
      doc.lastEditedBy = userId;
      await doc.save();

      io.to(`document_${documentId}`).emit("document_content_update", {
        documentId,
        content: mergedContent,
        user: { id: userId, name: userName || "Collaborator" },
      });
    });

    safeOn("document_save", async ({ documentId, content, userId, title, tags } = {}) => {
      if (!isValidId(documentId) || !isValidId(userId)) return;
      const doc = await Document.findById(documentId);
      if (!doc) return;
      if (typeof title === "string") doc.title = title;
      if (Array.isArray(tags)) doc.tags = tags;
      if (typeof content === "string") {
        doc.content = content;
      }
      doc.lastEditedBy = userId;
      await doc.save();
      socket.emit("document_saved", { documentId, savedAt: new Date().toISOString() });
    });

    // Message reactions
    safeOn("react_message", async ({ messageId, userId, emoji } = {}) => {
      if (!isValidId(messageId) || !isValidId(userId) || !emoji) return;
      const message = await Message.findById(messageId);
      if (!message) return;

      message.reactions = message.reactions || [];
      const existingIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId && r.emoji === emoji
      );
      if (existingIndex > -1) {
        message.reactions.splice(existingIndex, 1); // toggle off
      } else {
        message.reactions.push({ user: userId, emoji });
      }
      await message.save();

      const room =
        message.chatType === "workspace"
          ? `workspace_${message.workspace}`
          : `private_${message.groupId}`;
      io.to(room).emit("message_reaction_updated", { messageId, reactions: message.reactions });
    });

    // Real-time notification push — targeted at the recipient's personal room
    safeOn("send_notification", (notification) => {
      if (notification?.recipient) {
        io.to(`user_${notification.recipient}`).emit("receive_notification", notification);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
          onlineUsers.delete(socket.id);
          // Only mark the user offline if they have no other active sockets
          const stillOnline = Array.from(onlineUsers.values()).includes(userId);
          if (!stillOnline) {
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: Date.now() });
          }
          io.emit("online_users", Array.from(new Set(onlineUsers.values())));
        }
        if (socket.data?.documentId) {
          clearDocumentActivity(socket.data.documentId, socket.data.userId);
          socket.to(`document_${socket.data.documentId}`).emit("document_presence_update", {
            type: "leave",
            documentId: socket.data.documentId,
            user: { id: socket.data.userId, name: socket.data.userName || "Collaborator" },
          });
          socket.to(`document_${socket.data.documentId}`).emit("document_activity_update", {
            documentId: socket.data.documentId,
            activity: getActivitySnapshot(socket.data.documentId),
          });
        }
      } catch (error) {
        console.error("Error handling socket disconnect:", error.message);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
