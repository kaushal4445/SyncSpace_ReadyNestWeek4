import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiHome,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiBarChart2,
  FiUser,
  FiFolder,
  FiSettings,
  FiChevronDown,
  FiPlus,
  FiLogOut,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";
import JoinWorkspaceModal from "../workspace/JoinWorkspaceModal.jsx";
import WorkspaceSettingsModal from "../workspace/WorkspaceSettingsModal.jsx";

const links = [
  { to: "/dashboard", icon: <FiHome />, label: "Dashboard" },
  { to: "/documents", icon: <FiFileText />, label: "Documents" },
  { to: "/files", icon: <FiFolder />, label: "Files" },
  { to: "/chat", icon: <FiMessageSquare />, label: "Chat" },
  { to: "/calendar", icon: <FiCalendar />, label: "Calendar" },
  { to: "/analytics", icon: <FiBarChart2 />, label: "Analytics" },
  { to: "/profile", icon: <FiUser />, label: "Profile" },
  { to: "/settings", icon: <FiSettings />, label: "Settings" },
];

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { workspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspace() || {};
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const switcherRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
    } catch (error) {
      // Even if the API call fails, local session state is already cleared
    } finally {
      navigate("/login", { replace: true });
      onCloseMobile?.();
    }
  };

  const handleNavClick = () => onCloseMobile?.();

  const sidebarContent = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">TeamSync</h2>
        <button
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
          onClick={onCloseMobile}
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="relative mb-6" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="truncate text-left">
            {currentWorkspace ? currentWorkspace.name : "No workspace"}
          </span>
          <FiChevronDown
            className={`shrink-0 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
          />
        </button>

        {switcherOpen && (
          <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {workspaces?.length > 0 && (
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Switch Workspace
              </div>
            )}
            {workspaces?.map((w) => (
              <button
                key={w._id}
                onClick={() => {
                  setCurrentWorkspace(w);
                  setSwitcherOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  currentWorkspace?._id === w._id
                    ? "font-medium text-primary"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <span className="truncate">{w.name}</span>
              </button>
            ))}

            {currentWorkspace && (
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setSwitcherOpen(false);
                }}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FiSliders size={14} /> Workspace Settings
              </button>
            )}

            <button
              onClick={() => {
                setCreateOpen(true);
                setSwitcherOpen(false);
              }}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <FiPlus size={14} /> Create Workspace
            </button>
            <button
              onClick={() => {
                setJoinOpen(true);
                setSwitcherOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <FiPlus size={14} /> Join Workspace
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              }`
            }
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <div className="mb-2 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
          />
          <aside className="absolute left-0 top-0 bottom-0 flex w-72 flex-col overflow-y-auto bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:bg-slate-900/95">
            {sidebarContent}
          </aside>
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <JoinWorkspaceModal
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
      />
      <WorkspaceSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        workspace={currentWorkspace}
      />
    </>
  );
};

export default Sidebar;
