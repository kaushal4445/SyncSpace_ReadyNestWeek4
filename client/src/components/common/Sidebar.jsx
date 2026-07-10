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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary">TeamSync</h2>
        <button className="md:hidden text-secondary" onClick={onCloseMobile}>
          <FiX size={20} />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="relative mb-6" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          className="w-full flex items-center justify-between text-sm rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <span className="truncate text-left">
            {currentWorkspace ? currentWorkspace.name : "No workspace"}
          </span>
          <FiChevronDown
            className={`shrink-0 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
          />
        </button>

        {switcherOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-30 py-1 max-h-72 overflow-y-auto">
            {workspaces?.length > 0 && (
              <div className="px-3 py-1 text-xs font-semibold text-secondary uppercase">
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
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  currentWorkspace?._id === w._id
                    ? "text-primary font-medium"
                    : ""
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
                className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <FiSliders size={14} /> Workspace Settings
              </button>
            )}

            <button
              onClick={() => {
                setCreateOpen(true);
                setSwitcherOpen(false);
              }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary"
            >
              <FiPlus size={14} /> Create Workspace
            </button>
            <button
              onClick={() => {
                setJoinOpen(true);
                setSwitcherOpen(false);
              }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-primary"
            >
              <FiPlus size={14} /> Join Workspace
            </button>
          </div>
        )}
      </div>

      <nav className="space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? "bg-primary text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-1 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-secondary truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-60 hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (slide-in overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-white dark:bg-slate-800 p-4 shadow-xl overflow-y-auto">
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
