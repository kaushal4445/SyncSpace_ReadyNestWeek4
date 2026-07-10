import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiTrash2, FiLogOut, FiUserPlus, FiSearch } from "react-icons/fi";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import useDebounce from "../../hooks/useDebounce.js";

const TABS = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "invite", label: "Invite" },
  { id: "danger", label: "Danger Zone" },
];

const WorkspaceSettingsModal = ({ isOpen, onClose, workspace }) => {
  const { user } = useAuth();
  const { updateWorkspace, deleteWorkspace, leaveWorkspace, inviteMember, removeMember, changeMemberRole } =
    useWorkspace();
  const [tab, setTab] = useState("general");
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [isPublic, setIsPublic] = useState(!!workspace?.settings?.isPublic);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setDescription(workspace.description || "");
      setIsPublic(!!workspace.settings?.isPublic);
    }
  }, [workspace]);

  useEffect(() => {
    const run = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&types=users`);
        setSearchResults(data.results.users || []);
      } finally {
        setSearching(false);
      }
    };
    run();
  }, [debouncedQuery]);

  if (!workspace) return null;

  const isOwner = workspace.owner?._id === user?.id || workspace.owner === user?.id;
  const currentMembership = workspace.members?.find((m) => (m.user?._id || m.user) === user?.id);
  const isAdmin = isOwner || currentMembership?.role === "admin";

  const memberIds = new Set(workspace.members.map((m) => m.user?._id || m.user));

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWorkspace(workspace._id, { name, description, isPublic });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (targetUser) => {
    setInvitingId(targetUser._id);
    try {
      await inviteMember(workspace._id, { userId: targetUser._id, role: "member" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setInvitingId(null);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await removeMember(workspace._id, userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await changeMemberRole(workspace._id, userId, role);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change role");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${workspace.name}"? This cannot be undone.`)) return;
    try {
      await deleteWorkspace(workspace._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete workspace");
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${workspace.name}"?`)) return;
    try {
      await leaveWorkspace(workspace._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave workspace");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Workspace Settings — ${workspace.name}`} maxWidth="max-w-2xl">
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-secondary hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public workspace</p>
              <p className="text-xs text-secondary">Public workspaces are discoverable via search</p>
            </div>
            <input type="checkbox" checked={isPublic} disabled={!isAdmin} onChange={(e) => setIsPublic(e.target.checked)} />
          </div>
          <div>
            <p className="text-xs text-secondary">
              Invite code: <span className="font-mono">{workspace.inviteCode}</span>
            </p>
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      )}

      {tab === "members" && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {workspace.members.map((m) => {
            const memberUser = m.user;
            const isSelf = memberUser?._id === user?.id;
            const isMemberOwner = workspace.owner?._id === memberUser?._id;
            return (
              <div
                key={memberUser?._id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {memberUser?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {memberUser?.name} {isSelf && <span className="text-xs text-secondary">(you)</span>}
                    </p>
                    <p className="text-xs text-secondary">{memberUser?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMemberOwner ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Owner</span>
                  ) : isAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-2 py-1"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 capitalize">
                      {m.role}
                    </span>
                  )}
                  {isAdmin && !isMemberOwner && !isSelf && (
                    <button
                      onClick={() => handleRemove(memberUser._id)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Remove member"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "invite" && (
        <div>
          {!isAdmin ? (
            <p className="text-sm text-secondary">Only workspace admins can invite new members.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 mb-3">
                <FiSearch className="text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {searching && <p className="text-sm text-secondary px-1">Searching...</p>}
                {!searching && query.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="text-sm text-secondary px-1">No users found.</p>
                )}
                {searchResults.map((u) => {
                  const alreadyMember = memberIds.has(u._id);
                  return (
                    <div key={u._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-secondary">{u.email}</p>
                        </div>
                      </div>
                      {alreadyMember ? (
                        <span className="text-xs text-secondary">Already Member</span>
                      ) : (
                        <Button
                          variant="secondary"
                          className="!py-1 !px-3 text-xs flex items-center gap-1"
                          disabled={invitingId === u._id}
                          onClick={() => handleInvite(u)}
                        >
                          <FiUserPlus size={14} /> {invitingId === u._id ? "Inviting..." : "Invite"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "danger" && (
        <div className="space-y-3">
          {!isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium">Leave workspace</p>
                <p className="text-xs text-secondary">You'll lose access until re-invited.</p>
              </div>
              <Button variant="secondary" className="flex items-center gap-1" onClick={handleLeave}>
                <FiLogOut size={14} /> Leave
              </Button>
            </div>
          )}
          {isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50">
              <div>
                <p className="text-sm font-medium text-red-600">Delete workspace</p>
                <p className="text-xs text-secondary">Permanently deletes this workspace for all members.</p>
              </div>
              <Button variant="danger" className="flex items-center gap-1" onClick={handleDelete}>
                <FiTrash2 size={14} /> Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default WorkspaceSettingsModal;
