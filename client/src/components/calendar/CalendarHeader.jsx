import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const VIEWS = ["month", "week", "day"];

const CalendarHeader = ({ currentDate, view, onViewChange, onPrev, onNext, onToday }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
        <FiChevronLeft />
      </button>
      <h2 className="text-lg font-semibold min-w-[180px] text-center">
        {currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </h2>
      <button onClick={onNext} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
        <FiChevronRight />
      </button>
      <button onClick={onToday} className="text-xs text-primary hover:underline ml-2">
        Today
      </button>
    </div>

    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      {VIEWS.map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className={`text-xs px-3 py-1.5 rounded-lg capitalize ${
            view === v ? "bg-white dark:bg-slate-800 shadow text-primary" : "text-secondary"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);

export default CalendarHeader;
