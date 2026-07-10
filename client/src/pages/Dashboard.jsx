import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiFolder, FiUsers, FiCalendar, FiPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { analyticsService } from "../services/analyticsService.js";
import { documentService } from "../services/documentService.js";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";
import CreateWorkspaceModal from "../components/workspace/CreateWorkspaceModal.jsx";
import JoinWorkspaceModal from "../components/workspace/JoinWorkspaceModal.jsx";

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 flex items-center gap-4">
    {icon && <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>}
    <div className="min-w-0">
      <p className="text-secondary text-sm">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { currentWorkspace, workspaces, loading: workspacesLoading } = useWorkspace() || {};
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [statsRes, docsRes] = await Promise.all([
          analyticsService.getDashboard(currentWorkspace._id),
          documentService.getRecent(),
        ]);
        setStats(statsRes.data.stats);
        setRecentDocs(docsRes.data.documents);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentWorkspace]);

  if (workspacesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <>
        <EmptyState
          icon={<FiUsers />}
          title={workspaces?.length ? "No workspace selected" : "Welcome to SyncSpace"}
          description={
            workspaces?.length
              ? "Pick a workspace from the sidebar switcher to get started."
              : "Create a workspace to start collaborating with your team, or join one with an invite code."
          }
          action={
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
                <FiPlus /> Create Workspace
              </Button>
              <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                Join Workspace
              </Button>
            </div>
          }
        />
        <CreateWorkspaceModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => navigate("/dashboard")} />
        <JoinWorkspaceModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
      </>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-sm text-secondary">
          Workspace: <span className="font-medium text-slate-700 dark:text-slate-200">{currentWorkspace.name}</span>
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={stats?.totalDocuments ?? 0} icon={<FiFileText />} />
          <StatCard label="Total Files" value={stats?.totalFiles ?? 0} icon={<FiFolder />} />
          <StatCard label="Total Meetings" value={stats?.totalMeetings ?? 0} icon={<FiCalendar />} />
          <StatCard label="Active Members" value={stats?.activeMembers ?? 0} icon={<FiUsers />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <p className="text-sm font-semibold mb-3">Recent Documents</p>
          {recentDocs.length === 0 ? (
            <p className="text-xs text-secondary">No documents yet.</p>
          ) : (
            <div className="space-y-2">
              {recentDocs.slice(0, 5).map((d) => (
                <button
                  key={d._id}
                  onClick={() => navigate(`/documents/${d._id}`)}
                  className="flex items-center justify-between text-sm w-full text-left hover:text-primary"
                >
                  <span className="truncate">{d.title}</span>
                  <span className="text-xs text-secondary shrink-0 ml-2">{new Date(d.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <p className="text-sm font-semibold mb-3">Team Members</p>
          {currentWorkspace.members?.length ? (
            <div className="space-y-2">
              {currentWorkspace.members.slice(0, 6).map((m) => (
                <div key={m.user?._id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {m.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="truncate">{m.user?.name}</span>
                  <span className="text-xs text-secondary ml-auto capitalize">{m.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary">No members yet.</p>
          )}
        </div>
      </div>
      {/* Bar/Line/Pie charts live on the dedicated Analytics page to avoid duplicating chart logic here */}
    </div>
  );
};

export default Dashboard;
