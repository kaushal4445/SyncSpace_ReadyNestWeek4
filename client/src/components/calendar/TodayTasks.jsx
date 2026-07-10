const TodayTasks = ({ events }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
    <p className="text-sm font-semibold mb-3">Today's Tasks</p>
    {events.length === 0 ? (
      <p className="text-xs text-secondary">Nothing scheduled for today.</p>
    ) : (
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e._id} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color || "#3B82F6" }} />
            <span className="truncate">{e.title}</span>
            <span className="text-xs text-secondary ml-auto">
              {new Date(e.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default TodayTasks;
