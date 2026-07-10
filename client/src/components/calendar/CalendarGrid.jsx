import EventCard from "./EventCard.jsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildMonthMatrix = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const CalendarGrid = ({ currentDate, events, onEventClick, onDayClick }) => {
  const cells = buildMonthMatrix(currentDate);
  const eventsByDay = {};
  events.forEach((e) => {
    const key = new Date(e.startTime).toDateString();
    eventsByDay[key] = eventsByDay[key] || [];
    eventsByDay[key].push(e);
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-semibold text-secondary text-center py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const key = date?.toDateString();
          const dayEvents = key ? eventsByDay[key] || [] : [];
          const isToday = date && date.toDateString() === new Date().toDateString();

          return (
            <div
              key={i}
              onClick={() => date && onDayClick?.(date)}
              className={`min-h-[100px] border-b border-r border-slate-50 dark:border-slate-700 p-1.5 ${
                date ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50" : "bg-slate-50/40 dark:bg-slate-900/20"
              }`}
            >
              {date && (
                <>
                  <span className={`text-xs ${isToday ? "bg-primary text-white rounded-full px-1.5 py-0.5" : "text-secondary"}`}>
                    {date.getDate()}
                  </span>
                  <div className="mt-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <EventCard key={e._id} event={e} onClick={onEventClick} />
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-secondary">+{dayEvents.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
