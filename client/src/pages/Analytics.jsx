import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import AnalyticsBarChart from "../components/analytics/AnalyticsBarChart.jsx";
import AnalyticsLineChart from "../components/analytics/AnalyticsLineChart.jsx";
import AnalyticsPieChart from "../components/analytics/AnalyticsPieChart.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { analyticsService } from "../services/analyticsService.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

const ChartCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
    <p className="text-sm font-semibold mb-3">{title}</p>
    {children}
  </div>
);

const Analytics = () => {
  const { currentWorkspace } = useWorkspace() || {};
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState([]);
  const [chatStats, setChatStats] = useState([]);
  const [meetingStats, setMeetingStats] = useState([]);
  const [storage, setStorage] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);

  const fetchAll = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [growthRes, chatRes, meetingRes, storageRes, teamRes] = await Promise.all([
        analyticsService.getGrowth(currentWorkspace._id),
        analyticsService.getChatStats(currentWorkspace._id),
        analyticsService.getMeetingStats(currentWorkspace._id),
        analyticsService.getStorageUsage(currentWorkspace._id),
        analyticsService.getTeamActivity(currentWorkspace._id),
      ]);
      setGrowth(growthRes.data.series);
      setChatStats(chatRes.data.series);
      setMeetingStats(meetingRes.data.series);
      setStorage(storageRes.data.series);
      setTeamActivity(teamRes.data.activity);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!currentWorkspace) {
    return <EmptyState title="No workspace selected" description="Select a workspace to view analytics." />;
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Workspace Growth (members joined per month)">
          <AnalyticsLineChart data={growth} xKey="month" yKey="count" />
        </ChartCard>

        <ChartCard title="Chat Statistics (messages, last 14 days)">
          <AnalyticsBarChart data={chatStats} xKey="date" yKey="count" color="#10b981" />
        </ChartCard>

        <ChartCard title="Meeting Statistics by Status">
          <AnalyticsPieChart data={meetingStats} dataKey="count" nameKey="status" />
        </ChartCard>

        <ChartCard title="Storage Usage by File Type">
          <AnalyticsPieChart data={storage} dataKey="size" nameKey="type" />
        </ChartCard>

        <ChartCard title="Team Activity (edits + messages)">
          <AnalyticsBarChart data={teamActivity.map((t) => ({ name: t.user.name, edits: t.edits, messages: t.messages }))} xKey="name" yKey="messages" color="#f59e0b" />
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
