import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiFileText,
  FiFolder,
  FiUsers,
  FiCalendar,
  FiMessageSquare,
  FiUserPlus,
} from "react-icons/fi";
import api from "../../services/api";
import useDebounce from "../../hooks/useDebounce.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const debouncedQuery = useDebounce(query, 400);
  const navigate = useNavigate();
  const { currentWorkspace, inviteMember } = useWorkspace() || {};

  useEffect(() => {
    const run = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(
          `/search?q=${encodeURIComponent(debouncedQuery)}`,
        );
        setResults(data.results);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery]);

  const hasResults =
    results &&
    Object.values(results).some(
      (list) => Array.isArray(list) && list.length > 0,
    );

  const memberIds = new Set(
    (currentWorkspace?.members || []).map((m) => m.user?._id || m.user),
  );

  const handleInvite = async (user) => {
    if (!currentWorkspace) {
      toast.error("Please select a workspace first.");
      return;
    }
    setInvitingId(user._id);
    try {
      await inviteMember(currentWorkspace._id, {
        userId: user._id,
        role: "member",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not invite user");
    } finally {
      setInvitingId(null);
    }
  };

  const handleMessage = (user) => {
    setIsOpen(false);
    navigate("/chat", { state: { openPrivateChatUserId: user._id } });
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 text-secondary bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-1.5">
        <FiSearch className="shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Search users, workspaces, files..."
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-sm text-secondary">Searching...</div>
          )}
          {!loading && !hasResults && (
            <div className="p-4 text-sm text-secondary">
              No results for "{query}"
            </div>
          )}

          {!loading && results?.documents?.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-secondary px-2 py-1">
                Documents
              </p>
              {results.documents.map((d) => (
                <button
                  key={d._id}
                  onClick={() => navigate(`/documents/${d._id}`)}
                  className="flex items-center gap-2 w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <FiFileText className="text-primary shrink-0" />{" "}
                  <span className="truncate">{d.title}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && results?.files?.length > 0 && (
            <div className="p-2 border-t border-slate-50 dark:border-slate-700">
              <p className="text-xs font-semibold text-secondary px-2 py-1">
                Files
              </p>
              {results.files.map((f) => (
                <a
                  key={f._id}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <FiFolder className="text-primary shrink-0" />{" "}
                  <span className="truncate">{f.originalName}</span>
                </a>
              ))}
            </div>
          )}

          {!loading && results?.users?.length > 0 && (
            <div className="p-2 border-t border-slate-50 dark:border-slate-700">
              <p className="text-xs font-semibold text-secondary px-2 py-1">
                Users
              </p>
              {results.users.map((u) => {
                const isMember = memberIds.has(u._id);
                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between gap-2 px-2 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{u.name}</p>
                        <p className="text-xs text-secondary truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Send message"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleMessage(u)}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10"
                      >
                        <FiMessageSquare size={15} />
                      </button>
                      {isMember ? (
                        <span className="text-xs text-secondary px-1">
                          Member
                        </span>
                      ) : (
                        <button
                          title="Invite to workspace"
                          disabled={invitingId === u._id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInvite(u)}
                          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 disabled:opacity-50"
                        >
                          <FiUserPlus size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && results?.meetings?.length > 0 && (
            <div className="p-2 border-t border-slate-50 dark:border-slate-700">
              <p className="text-xs font-semibold text-secondary px-2 py-1">
                Meetings
              </p>
              {results.meetings.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-2 px-2 py-2 text-sm"
                >
                  <FiCalendar className="text-primary shrink-0" />{" "}
                  <span className="truncate">{m.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
