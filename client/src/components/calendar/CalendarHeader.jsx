import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const VIEWS = ["month", "week", "day"];

const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}) => (
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onPrev}
        className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <FiChevronLeft />
      </button>
      <h2 className="text-lg font-semibold min-w-[180px] text-center">
        {currentDate.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}
      </h2>
      <button
        onClick={onNext}
        className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <FiChevronRight />
      </button>
      <button
        onClick={onToday}
        className="ml-2 text-xs font-medium text-primary hover:underline"
      >
        Today
      </button>
    </div>

    <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
      {VIEWS.map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-colors ${
            view === v
              ? "bg-white text-primary shadow-sm dark:bg-slate-800"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);

export default CalendarHeader;
