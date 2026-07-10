import Calendar from "react-calendar";

const MiniCalendar = ({ value, onChange, markedDates = [] }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-3">
    <Calendar
      value={value}
      onChange={onChange}
      className="syncspace-mini-calendar border-0 text-xs w-full"
      tileClassName={({ date }) =>
        markedDates.some((d) => new Date(d).toDateString() === date.toDateString()) ? "font-bold text-primary" : ""
      }
    />
  </div>
);

export default MiniCalendar;
