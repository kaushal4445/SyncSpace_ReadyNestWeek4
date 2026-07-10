import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiDownload,
  FiTrash2,
  FiClock,
  FiShare2,
  FiUsers,
} from "react-icons/fi";
import RichTextEditor from "../components/documents/RichTextEditor.jsx";
import ShareModal from "../components/documents/ShareModal.jsx";
import VersionHistoryModal from "../components/documents/VersionHistoryModal.jsx";
import Button from "../components/ui/Button.jsx";
import { documentService } from "../services/documentService.js";
import { socket } from "../services/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

const AUTOSAVE_DELAY = 1500;

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | reconnecting | error
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [activityStatuses, setActivityStatuses] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const autosaveTimer = useRef(null);
  const broadcastTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const baseContentRef = useRef("");
  const pendingSyncRef = useRef("");
  const lastBroadcastedContentRef = useRef("");
  const contentRef = useRef("");

  useEffect(() => {
    documentService
      .getById(id)
      .then(({ data }) => {
        const loadedDocument = data.document;
        setDocument(loadedDocument);
        setTitle(loadedDocument.title);
        setContent(loadedDocument.content || "");
        setTags(loadedDocument.tags || []);
        baseContentRef.current = loadedDocument.content || "";
        contentRef.current = loadedDocument.content || "";
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to load document");
        navigate("/documents");
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !user?.id) return undefined;

    socket.connect();
    socket.emit("join_document", {
      documentId: id,
      userId: user.id,
      userName: user.name,
    });

    const handleConnect = () => {
      setSaveStatus("saved");
      socket.emit("join_document", {
        documentId: id,
        userId: user.id,
        userName: user.name,
      });
      if (pendingSyncRef.current) {
        socket.emit("document_change", {
          documentId: id,
          userId: user.id,
          baseContent: baseContentRef.current,
          incomingContent: pendingSyncRef.current,
          userName: user.name,
        });
        pendingSyncRef.current = "";
      }
    };

    const handleDisconnect = () => {
      setSaveStatus("reconnecting");
    };

    const handlePresenceSnapshot = ({
      collaborators: nextCollaborators = [],
    }) => {
      setCollaborators(nextCollaborators);
    };

    const handleActivitySnapshot = ({ activity = [] }) => {
      setActivityStatuses(activity);
    };

    const handleActivityUpdate = ({ activity = [] }) => {
      setActivityStatuses(activity);
    };

    const handlePresenceUpdate = ({ type, user: collaborator }) => {
      setCollaborators((prev) => {
        if (!collaborator?.id) return prev;
        if (type === "leave") {
          return prev.filter((entry) => entry.id !== collaborator.id);
        }
        return prev.some((entry) => entry.id === collaborator.id)
          ? prev.map((entry) =>
              entry.id === collaborator.id
                ? { ...entry, ...collaborator }
                : entry,
            )
          : [...prev, collaborator];
      });
    };

    const handleCursorUpdate = ({
      userId: remoteUserId,
      userName,
      position,
    }) => {
      if (!remoteUserId || remoteUserId === user.id) return;
      setRemoteCursors((prev) => {
        const next = prev.filter((entry) => entry.userId !== remoteUserId);
        return position
          ? [...next, { userId: remoteUserId, userName, position }]
          : next;
      });
    };

    const handleDocumentContentUpdate = ({
      content: remoteContent,
      user: remoteUser,
    }) => {
      if (remoteUser?.id === user.id) return;
      if (remoteContent === contentRef.current) return;
      setContent(remoteContent || "");
      setDocument((prev) =>
        prev ? { ...prev, content: remoteContent || "" } : prev,
      );
      contentRef.current = remoteContent || "";
      baseContentRef.current = remoteContent || "";
      setSaveStatus("saved");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("document_presence_snapshot", handlePresenceSnapshot);
    socket.on("document_presence_update", handlePresenceUpdate);
    socket.on("document_activity_snapshot", handleActivitySnapshot);
    socket.on("document_activity_update", handleActivityUpdate);
    socket.on("document_cursor_update", handleCursorUpdate);
    socket.on("document_content_update", handleDocumentContentUpdate);
    socket.on("document_saved", () => setSaveStatus("saved"));

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("document_presence_snapshot", handlePresenceSnapshot);
      socket.off("document_presence_update", handlePresenceUpdate);
      socket.off("document_activity_snapshot", handleActivitySnapshot);
      socket.off("document_activity_update", handleActivityUpdate);
      socket.off("document_cursor_update", handleCursorUpdate);
      socket.off("document_content_update", handleDocumentContentUpdate);
      socket.off("document_saved");
      if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit("leave_document", { documentId: id });
    };
  }, [id, user?.id, user?.name]);

  const persist = useCallback(
    async (payload) => {
      setSaveStatus("saving");
      try {
        const response = await documentService.update(id, {
          ...payload,
          baseContent: baseContentRef.current,
        });
        setDocument(response.data.document || null);
        if (response.data.document?.content) {
          baseContentRef.current = response.data.document.content;
        }
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        toast.error("Autosave failed");
      }
    },
    [id],
  );

  const scheduleAutosave = (payload) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persist(payload), AUTOSAVE_DELAY);
  };

  const broadcastContentChange = (html) => {
    if (!id || !user?.id) return;
    const nextContent = html || "";
    if (nextContent === lastBroadcastedContentRef.current) return;
    lastBroadcastedContentRef.current = nextContent;
    contentRef.current = nextContent;
    if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
    broadcastTimerRef.current = setTimeout(() => {
      pendingSyncRef.current = nextContent;
      socket.emit("document_change", {
        documentId: id,
        userId: user.id,
        baseContent: baseContentRef.current,
        incomingContent: nextContent,
        userName: user.name,
      });
      baseContentRef.current = nextContent;
      broadcastTimerRef.current = null;
    }, 120);
  };

  const emitActivity = useCallback(
    (status) => {
      if (!id || !user?.id) return;
      if (status === "typing") {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        socket.emit("document_activity", {
          documentId: id,
          userId: user.id,
          userName: user.name,
          status: "typing",
        });
        typingTimerRef.current = setTimeout(() => {
          socket.emit("document_activity", {
            documentId: id,
            userId: user.id,
            userName: user.name,
            status: "idle",
          });
        }, 1800);
        return;
      }

      if (status === "editing") {
        socket.emit("document_activity", {
          documentId: id,
          userId: user.id,
          userName: user.name,
          status: "editing",
        });
        return;
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit("document_activity", {
        documentId: id,
        userId: user.id,
        userName: user.name,
        status: "idle",
      });
    },
    [id, user?.id, user?.name],
  );

  const handleTitleChange = (e) => {
    const nextTitle = e.target.value;
    setTitle(nextTitle);
    scheduleAutosave({ title: nextTitle });
  };

  const handleContentChange = (html) => {
    const nextContent = html || "";
    setContent(nextContent);
    contentRef.current = nextContent;
    scheduleAutosave({ content: nextContent });
    broadcastContentChange(nextContent);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const nextTags = [...tags, tagInput.trim()];
      setTags(nextTags);
      setTagInput("");
      persist({ tags: nextTags });
    }
  };

  const handleRemoveTag = (tag) => {
    const nextTags = tags.filter((t) => t !== tag);
    setTags(nextTags);
    persist({ tags: nextTags });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    await documentService.remove(id);
    toast.success("Document deleted");
    navigate("/documents");
  };

  if (!document)
    return (
      <div className="p-6 text-sm text-secondary">Loading document...</div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/documents")}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary"
        >
          <FiArrowLeft /> Back to Documents
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary capitalize">
            {saveStatus}
          </span>
          <Button
            variant="secondary"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1"
          >
            <FiClock /> History
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1"
          >
            <FiShare2 /> Share
          </Button>
          <a
            href={documentService.exportPdfUrl(id)}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" className="flex items-center gap-1">
              <FiDownload /> PDF
            </Button>
          </a>
          <Button
            variant="danger"
            onClick={handleDelete}
            className="flex items-center gap-1"
          >
            <FiTrash2 />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <FiUsers />
          <span>
            {collaborators.length || 1} collaborator
            {collaborators.length === 1 ? "" : "s"} online
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {collaborators.map((collaborator) => (
            <span
              key={collaborator.id}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            >
              {collaborator.name}
            </span>
          ))}
        </div>
      </div>

      <div className="text-sm text-secondary">
        {activityStatuses.length ? (
          activityStatuses.map((status) => {
            const label =
              status.status === "typing"
                ? "is typing..."
                : status.status === "editing"
                  ? "is editing..."
                  : "is idle";
            return (
              <span key={`${status.id}-${status.status}`} className="mr-2">
                {status.name} {label}
              </span>
            );
          })
        ) : (
          <span>No active collaborators right now.</span>
        )}
      </div>

      <input
        value={title}
        onChange={handleTitleChange}
        className="text-3xl font-bold w-full bg-transparent outline-none"
        placeholder="Untitled Document"
      />

      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag + Enter"
          className="text-xs bg-transparent outline-none border-b border-dashed border-slate-300 px-1"
        />
      </div>

      <RichTextEditor
        value={content}
        onChange={handleContentChange}
        onFocus={() => emitActivity("editing")}
        onBlur={() => emitActivity("idle")}
        onTyping={() => emitActivity("typing")}
        onCursorChange={(position) => {
          if (!id || !user?.id) return;
          socket.emit("document_cursor", {
            documentId: id,
            userId: user.id,
            userName: user.name,
            position,
          });
        }}
        remoteCursors={remoteCursors}
      />

      <ShareModal
        document={document}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        onUpdated={setDocument}
      />
      <VersionHistoryModal
        document={document}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestored={(updated) => {
          setDocument(updated);
          setContent(updated.content);
          baseContentRef.current = updated.content || "";
        }}
      />
    </div>
  );
};

export default DocumentEditor;
