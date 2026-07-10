import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  FiSend,
  FiPaperclip,
  FiSearch,
  FiFileText,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConversationList from "../components/chat/ConversationList.jsx";
import MessageBubble from "../components/chat/MessageBubble.jsx";
import TypingIndicator from "../components/chat/TypingIndicator.jsx";
import EmojiPickerButton from "../components/chat/EmojiPickerButton.jsx";
import DocumentPickerModal from "../components/chat/DocumentPickerModal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { chatService } from "../services/chatService.js";
import { fileService } from "../services/fileService.js";
import { socket } from "../services/socket.js";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import useSocketEvent from "../hooks/useSocketEvent.js";
import { groupMessagesByDay } from "../utils/chatDateUtils.js";

const ACK_TIMEOUT_MS = 8000;

const Chat = () => {
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace() || {};
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // null = workspace channel
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // string being typed after "@", or null when closed
  const [pendingMentions, setPendingMentions] = useState([]); // [{id, name}]
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const typingClearTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const seenMessageIds = useRef(new Set());
  const prevScrollHeightRef = useRef(0);
  const isNearBottomRef = useRef(true);

  const roomId =
    activeUser && user ? [user.id, activeUser._id].sort().join("_") : null;
  const typingRoom = activeUser
    ? `private_${roomId}`
    : currentWorkspace
      ? `workspace_${currentWorkspace._id}`
      : null;

  const workspaceMembers = useMemo(
    () =>
      (currentWorkspace?.members || [])
        .map((m) => m.user)
        .filter((u) => u && u._id !== user?.id),
    [currentWorkspace, user],
  );

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await chatService.getConversations();
      setConversations(data.conversations);
    } catch (error) {
      // non-fatal — conversation list just stays as-is
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Deep-link support: /chat?userId=... opens (or starts) a private conversation.
  // Depends on the actual param value (not []) so this also fires when the
  // user is already on /chat and clicks "Chat" on another search result —
  // react-router doesn't remount the page for a query-string-only navigation.
  const deepLinkUserId =
    searchParams.get("userId") || location.state?.openPrivateChatUserId;
  useEffect(() => {
    if (!deepLinkUserId) return;
    let cancelled = false;
    const openUser = async () => {
      try {
        const { data } = await api.get(`/auth/users/${deepLinkUserId}`);
        if (!cancelled) setActiveUser(data.user);
        if (!cancelled) setMobileShowChat(true);
      } catch (error) {
        toast.error("Could not open that conversation");
      } finally {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("userId");
            return next;
          },
          { replace: true },
        );
      }
    };
    openUser();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkUserId]);

  const loadMessages = useCallback(async () => {
    if (!activeUser && !currentWorkspace) return;
    setMessagesLoading(true);
    seenMessageIds.current = new Set();
    try {
      const { data } = activeUser
        ? await chatService.getPrivateMessages(activeUser._id, { page: 1 })
        : await chatService.getWorkspaceMessages(currentWorkspace._id, {
            page: 1,
          });
      setMessages(data.messages);
      data.messages.forEach((m) => seenMessageIds.current.add(m._id));
      setPage(1);
      setHasMore(data.messages.length >= 30);
    } catch (error) {
      toast.error("Failed to load messages");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [activeUser, currentWorkspace]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Join/leave the right Socket.IO room whenever the active channel changes
  useEffect(() => {
    if (activeUser && roomId) {
      socket.emit("join_private", roomId);
      return () => socket.emit("leave_private", roomId);
    }
    if (!activeUser && currentWorkspace) {
      socket.emit("join_workspace", currentWorkspace._id);
      return () => socket.emit("leave_workspace", currentWorkspace._id);
    }
  }, [activeUser, currentWorkspace, roomId]);

  useSocketEvent(
    "receive_message",
    (message) => {
      const belongsHere = activeUser
        ? message.chatType === "private" &&
          [message.sender._id, message.recipient].includes(activeUser._id)
        : message.chatType === "workspace" &&
          message.workspace === currentWorkspace?._id;

      if (belongsHere) {
        if (seenMessageIds.current.has(message._id)) return; // already have it (e.g. from our own ack)
        seenMessageIds.current.add(message._id);
        setMessages((prev) => {
          // Reconcile: if this is our own message coming back and we still
          // have the optimistic placeholder around (ack hasn't landed yet),
          // replace it instead of appending a duplicate.
          const optimisticIndex = prev.findIndex(
            (m) =>
              m.pending &&
              m.sender?._id === message.sender._id &&
              m.content === message.content,
          );
          if (optimisticIndex > -1) {
            const next = [...prev];
            next[optimisticIndex] = message;
            return next;
          }
          return [...prev, message];
        });
      }
      loadConversations();
    },
    [activeUser, currentWorkspace],
  );

  useSocketEvent(
    "message_reaction_updated",
    ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
      );
    },
    [],
  );

  useSocketEvent(
    "message_seen",
    ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, seenBy: [...new Set([...(m.seenBy || []), userId])] }
            : m,
        ),
      );
    },
    [],
  );

  useSocketEvent(
    "user_typing",
    ({ userName }) => {
      setTypingUser(userName);
      clearTimeout(typingClearTimeout.current);
      // Fallback auto-clear: if a stop_typing event never arrives (dropped
      // connection, tab closed abruptly), don't leave the indicator stuck.
      typingClearTimeout.current = setTimeout(() => setTypingUser(null), 3000);
    },
    [],
  );
  useSocketEvent(
    "user_stop_typing",
    () => {
      clearTimeout(typingClearTimeout.current);
      setTypingUser(null);
    },
    [],
  );

  useSocketEvent(
    "socket_error",
    ({ message }) => {
      toast.error(message || "Something went wrong");
    },
    [],
  );

  // Auto-scroll to bottom only for new messages, and only if the user was
  // already near the bottom (so loading older history above doesn't yank
  // their scroll position, and so they're not force-scrolled away while
  // reading older messages).
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark incoming private messages as seen once they're visible
  useEffect(() => {
    if (!activeUser || !user) return;
    const unseen = messages.filter(
      (m) =>
        (m.sender?._id || m.sender) !== user.id &&
        !(m.seenBy || []).includes(user.id),
    );
    unseen.forEach((m) => {
      socket.emit("mark_seen", {
        messageId: m._id,
        userId: user.id,
        roomId: `private_${roomId}`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeUser, user]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  };

  const sendSocketMessage = (payload) =>
    new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("timeout"));
        }
      }, ACK_TIMEOUT_MS);

      socket.emit("send_message", payload, (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (response?.success) resolve(response.message);
        else reject(new Error(response?.message || "Failed to send"));
      });
    });

  const buildBasePayload = () => ({
    sender: user.id,
    recipient: activeUser?._id,
    workspace: activeUser ? undefined : currentWorkspace?._id,
    chatType: activeUser ? "private" : "workspace",
    groupId: roomId,
    mentions: pendingMentions.map((m) => m.id),
  });

  const dispatchMessage = async (extra, optimisticExtra = {}) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: user.id, name: user.name, avatar: user.avatar },
      chatType: activeUser ? "private" : "workspace",
      recipient: activeUser?._id,
      workspace: activeUser ? undefined : currentWorkspace?._id,
      createdAt: new Date().toISOString(),
      seenBy: [],
      reactions: [],
      pending: true,
      ...optimisticExtra,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    isNearBottomRef.current = true;

    try {
      const saved = await sendSocketMessage({
        ...buildBasePayload(),
        ...extra,
      });
      seenMessageIds.current.add(saved._id);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      );
      toast.error("Message failed to send");
    }
  };

  const handleSend = () => {
    if (!draft.trim() || !user) return;
    if (!activeUser && !currentWorkspace) return;

    dispatchMessage({ content: draft }, { content: draft });
    setDraft("");
    setPendingMentions([]);
    setMentionQuery(null);
    if (typingRoom) socket.emit("stop_typing", { roomId: typingRoom });
    clearTimeout(typingTimeout.current);
  };

  const handleShareDocument = (doc) => {
    dispatchMessage(
      { documentShare: doc._id },
      { documentShare: { _id: doc._id, title: doc.title } },
    );
  };

  const handleFilesSelected = async (fileList) => {
    if (!fileList?.length) return;

    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("files", f));
    formData.append("category", "chat");

    if (activeUser) {
      formData.append("chatType", "private");
      formData.append("recipientId", activeUser._id);
    } else if (currentWorkspace?._id) {
      formData.append("chatType", "workspace");
    } else {
      toast.error("Select a workspace or open a conversation to share files");
      return;
    }

    const uploadingToast = toast.loading("Uploading...");
    try {
      const { data } = activeUser
        ? await fileService.uploadToChat(formData)
        : await fileService.upload(currentWorkspace._id, formData);
      const attachments = data.files.map((f) => ({
        url: f.url,
        fileType: f.fileType,
        fileName: f.originalName,
        fileSize: f.fileSize,
      }));
      toast.dismiss(uploadingToast);
      await dispatchMessage({ attachments }, { attachments });
    } catch (error) {
      toast.dismiss(uploadingToast);
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleTyping = (val) => {
    setDraft(val);

    // Mention autocomplete: only in workspace chat, triggered by an "@" that
    // isn't part of an already-completed mention.
    if (!activeUser) {
      const match = val.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
      setMentionQuery(match ? match[1] : null);
    }

    if (!typingRoom) return;
    socket.emit("typing", { roomId: typingRoom, userName: user.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(
      () => socket.emit("stop_typing", { roomId: typingRoom }),
      1500,
    );
  };

  const insertMention = (member) => {
    setDraft((prev) =>
      prev.replace(
        /(?:^|\s)@([a-zA-Z0-9._-]*)$/,
        (m) => `${m.startsWith(" ") ? " " : ""}@${member.name} `,
      ),
    );
    setPendingMentions((prev) =>
      prev.some((p) => p.id === member._id)
        ? prev
        : [...prev, { id: member._id, name: member.name }],
    );
    setMentionQuery(null);
  };

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    return workspaceMembers
      .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
      .slice(0, 5);
  }, [mentionQuery, workspaceMembers]);

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    prevScrollHeightRef.current = el?.scrollHeight || 0;

    try {
      const nextPage = page + 1;
      const res = activeUser
        ? await chatService.getPrivateMessages(activeUser._id, {
            page: nextPage,
          })
        : await chatService.getWorkspaceMessages(currentWorkspace._id, {
            page: nextPage,
          });

      if (res.data.messages.length) {
        res.data.messages.forEach((m) => seenMessageIds.current.add(m._id));
        setMessages((prev) => [...res.data.messages, ...prev]);
        setPage(nextPage);
        setHasMore(res.data.messages.length >= 30);
        // Restore scroll position so loading history doesn't jump the view
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
        });
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleReact = (messageId, emoji) => {
    if (!user) return;
    socket.emit("react_message", { messageId, userId: user.id, emoji });
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupMessagesByDay(messages);
    const q = searchQuery.toLowerCase();
    return groupMessagesByDay(
      messages.filter((m) => m.content?.toLowerCase().includes(q)),
    );
  }, [messages, searchQuery]);

  const highlight = (text) => {
    if (!searchQuery.trim() || !text) return text;
    const parts = text.split(
      new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "ig",
      ),
    );
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-300 dark:bg-yellow-500 text-inherit rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (workspaceLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!currentWorkspace && conversations.length === 0 && !activeUser) {
    return (
      <EmptyState
        title="No workspace selected"
        description="Select or create a workspace to start chatting, or open a private conversation from Search."
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={conversations}
        activeUserId={activeUser?._id}
        onSelect={(u) => {
          setActiveUser(u);
          setMobileShowChat(true);
        }}
        workspaceChannel={!activeUser}
        onSelectWorkspace={() => {
          if (!currentWorkspace) return;
          setActiveUser(null);
          setMobileShowChat(true);
        }}
        workspaceName={currentWorkspace?.name}
        hiddenOnMobile={mobileShowChat}
      />

      <div
        className={`flex-1 flex-col min-w-0 relative ${mobileShowChat ? "flex" : "hidden sm:flex"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
      >
        {isDraggingFile && (
          <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
            <p className="text-primary font-medium">Drop files to share</p>
          </div>
        )}

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileShowChat(false)}
              className="sm:hidden text-secondary hover:text-primary shrink-0"
            >
              <FiArrowLeft size={18} />
            </button>
            <p className="font-semibold text-sm truncate">
              {activeUser
                ? activeUser.name
                : currentWorkspace
                  ? `# ${currentWorkspace.name}`
                  : "Select a conversation"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1">
                <FiSearch className="text-secondary" size={14} />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search this conversation"
                  className="bg-transparent outline-none text-xs w-40"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <FiX className="text-secondary" size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-secondary hover:text-primary"
              >
                <FiSearch size={16} />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4"
        >
          {(activeUser || currentWorkspace) &&
            hasMore &&
            messages.length > 0 && (
              <button
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="text-xs text-primary hover:underline block mx-auto mb-3 disabled:opacity-50"
              >
                {loadingOlder ? "Loading..." : "Load older messages"}
              </button>
            )}

          {messagesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-10 w-1/2 ml-auto" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : !activeUser && !currentWorkspace ? (
            <EmptyState
              title="No conversation open"
              description="Pick a teammate or a workspace channel to start chatting."
            />
          ) : messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Be the first to send a message."
            />
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center justify-center my-3">
                  <span className="text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-secondary rounded-full px-3 py-1">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((m, idx) => {
                  const senderId = m.sender?._id || m.sender;
                  const isOwn = senderId === user.id;
                  const prevMsg = group.messages[idx - 1];
                  const showMeta =
                    !prevMsg ||
                    (prevMsg.sender?._id || prevMsg.sender) !== senderId;
                  return (
                    <div key={m._id}>
                      <MessageBubble
                        message={
                          searchQuery.trim() ? { ...m, content: undefined } : m
                        }
                        isOwn={isOwn}
                        showMeta={showMeta}
                        onReact={handleReact}
                        currentUserId={user.id}
                      />
                      {searchQuery.trim() && m.content && (
                        <div
                          className={`text-sm px-4 -mt-2 mb-2 ${isOwn ? "text-right" : ""}`}
                        >
                          {highlight(m.content)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <TypingIndicator userName={typingUser} />

        {mentionCandidates.length > 0 && (
          <div className="mx-3 mb-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
            {mentionCandidates.map((m) => (
              <button
                key={m._id}
                onClick={() => insertMention(m)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                @{m.name}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-secondary hover:text-primary"
            title="Attach a file"
          >
            <FiPaperclip size={20} />
          </button>
          <button
            onClick={() => setDocPickerOpen(true)}
            className="text-secondary hover:text-primary"
            title="Share a document"
            disabled={!currentWorkspace || Boolean(activeUser)}
          >
            <FiFileText size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            value={draft}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              activeUser || currentWorkspace
                ? "Type a message..."
                : "Select a conversation first"
            }
            disabled={!activeUser && !currentWorkspace}
            className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
          <EmojiPickerButton
            onSelect={(emoji) => setDraft((prev) => prev + emoji)}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || (!activeUser && !currentWorkspace)}
            className="bg-primary text-white rounded-lg p-2 hover:bg-primary-dark disabled:opacity-50"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>

      <DocumentPickerModal
        isOpen={docPickerOpen}
        onClose={() => setDocPickerOpen(false)}
        workspaceId={!activeUser ? currentWorkspace?._id : null}
        onPick={handleShareDocument}
        disabled={Boolean(activeUser)}
      />
    </div>
  );
};

export default Chat;
