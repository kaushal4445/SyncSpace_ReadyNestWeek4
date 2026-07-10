import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCopy, FiCheck, FiX } from "react-icons/fi";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { documentService } from "../../services/documentService.js";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useDebounce from "../../hooks/useDebounce.js";

const Avatar = ({ user, size = 32 }) => (
  <div
    className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {user?.avatar ? (
      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
    ) : (
      (user?.name || "?").charAt(0).toUpperCase()
    )}
  </div>
);

const ShareModal = ({ document, isOpen, onClose, onUpdated }) => {
  const { user: currentUser } = useAuth();
  const [isPublic, setIsPublic] = useState(document?.isPublic || false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState("viewer");
  const debouncedQuery = useDebounce(query, 350);

  const sharedWith = document?.sharedWith || [];
  const isOwner = document?.createdBy?._id === currentUser?.id || document?.createdBy === currentUser?.id;

  useEffect(() => {
    setIsPublic(document?.isPublic || false);
  }, [document]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/search", { params: { q: debouncedQuery, types: "users" } });
        if (!cancelled) {
          const alreadySharedIds = new Set([
            document?.createdBy?._id || document?.createdBy,
            ...sharedWith.map((s) => s.user?._id || s.user),
          ]);
          setResults((data.results?.users || []).filter((u) => !alreadySharedIds.has(u._id)));
        }
      } catch (error) {
        if (!cancelled) toast.error("Search failed");
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleTogglePublic = async () => {
    setSaving(true);
    try {
      const { data } = await documentService.share(document._id, { isPublic: !isPublic });
      setIsPublic(!isPublic);
      onUpdated?.(data.document);
      toast.success(!isPublic ? "Document is now public" : "Document is now private");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update sharing");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/documents/${document._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Couldn't copy link");
    }
  };

  const handleShareWithUser = async (targetUser) => {
    setSaving(true);
    try {
      const { data } = await documentService.share(document._id, { userId: targetUser._id, role: selectedRole });
      onUpdated?.(data.document);
      toast.success(`Shared with ${targetUser.name}`);
      setQuery("");
      setResults([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to share document");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await documentService.updateShareRole(document._id, userId, role);
      onUpdated?.(data.document);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemoveAccess = async (userId) => {
    try {
      const { data } = await documentService.removeShareAccess(document._id, userId);
      onUpdated?.(data.document);
      toast.success("Access removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove access");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${document?.title}"`}>
      <div className="space-y-5">
        {/* Public link + toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Public access</p>
            <p className="text-xs text-secondary">Anyone with the link can view this document</p>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={saving || !isOwner}
            className={`w-11 h-6 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-slate-300"} disabled:opacity-50`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {isPublic && (
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="truncate text-secondary">{`${window.location.origin}/documents/${document?._id}`}</span>
            {copied ? <FiCheck className="text-green-500 shrink-0 ml-2" /> : <FiCopy className="text-secondary shrink-0 ml-2" />}
          </button>
        )}

        {/* Autocomplete user search */}
        <div>
          <p className="text-sm font-medium mb-2">Invite teammates</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teammates..."
              className="flex-1 border border-slate-200 dark:border-slate-600 bg-transparent rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-200 dark:border-slate-600 bg-transparent rounded-lg px-2 py-2 text-xs outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          {(searching || results.length > 0) && (
            <div className="border border-slate-100 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {searching && <p className="text-xs text-secondary p-3">Searching...</p>}
              {!searching &&
                results.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleShareWithUser(u)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left disabled:opacity-50"
                  >
                    <Avatar user={u} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-secondary truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              {!searching && results.length === 0 && debouncedQuery.trim().length >= 2 && (
                <p className="text-xs text-secondary p-3">No matching teammates found</p>
              )}
            </div>
          )}
        </div>

        {/* People with access */}
        <div>
          <p className="text-sm font-medium mb-2">People with access</p>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {document?.createdBy && (
              <div className="flex items-center gap-3 py-1.5">
                <Avatar user={document.createdBy} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {document.createdBy.name} {document.createdBy._id === currentUser?.id && "(You)"}
                  </p>
                  <p className="text-xs text-secondary truncate">{document.createdBy.email}</p>
                </div>
                <span className="text-xs text-secondary font-medium shrink-0">Owner</span>
              </div>
            )}

            {sharedWith.map((entry) => {
              const u = entry.user;
              if (!u) return null;
              return (
                <div key={u._id} className="flex items-center gap-3 py-1.5">
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-secondary truncate">{u.email}</p>
                  </div>
                  {isOwner ? (
                    <>
                      <select
                        value={entry.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded-md px-1.5 py-1 outline-none shrink-0"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        onClick={() => handleRemoveAccess(u._id)}
                        className="text-secondary hover:text-red-500 shrink-0"
                        title="Remove access"
                      >
                        <FiX size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-secondary capitalize shrink-0">{entry.role}</span>
                  )}
                </div>
              );
            })}

            {sharedWith.length === 0 && (
              <p className="text-xs text-secondary py-2">Not shared with anyone else yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
