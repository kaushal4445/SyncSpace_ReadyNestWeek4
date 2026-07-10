const CalendarStats = ({ totalEvents, totalMeetings }) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 text-center">
      <p className="text-2xl font-bold text-primary">{totalEvents}</p>
      <p className="text-xs text-secondary">Events this month</p>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 text-center">
      <p className="text-2xl font-bold text-primary">{totalMeetings}</p>
      <p className="text-xs text-secondary">Meetings scheduled</p>
    </div>
  </div>
);

export default CalendarStats;
