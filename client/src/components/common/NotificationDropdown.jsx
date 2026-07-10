import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../services/api";
import useSocketEvent from "../../hooks/useSocketEvent";
import EmptyState from "../ui/EmptyState.jsx";

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Live push from Socket.IO (server emits to the user's personal room)
  useSocketEvent("receive_notification", (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  const markAllRead = async () => {
    await api.put("/notifications/read");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification) => {
    markOneRead(notification._id);
    setIsOpen(false);
    if (notification.type === "workspace_invite") return;
    if (notification.link) navigate(notification.link);
  };

  const handleInviteResponse = async (notification, action) => {
    try {
      await api.post(`/notifications/${notification._id}/respond`, { action });
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notification._id),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success(
        action === "accept" ? "Invitation accepted" : "Invitation declined",
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not handle invitation",
      );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-50 mt-3 w-[min(90vw,20rem)] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-secondary">Loading...</div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  title="You're all caught up"
                  description="No notifications yet."
                />
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`w-full px-4 py-3 text-sm border-b border-slate-50 dark:border-slate-700 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <p>{n.message}</p>
                      <p className="text-xs text-secondary mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                    {n.type === "workspace_invite" && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteResponse(n, "accept");
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteResponse(n, "reject");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
