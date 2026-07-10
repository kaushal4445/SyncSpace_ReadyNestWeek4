import { FiMenu } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

const Topbar = ({ onOpenMobileSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
        >
          <FiMenu size={20} />
        </button>
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationDropdown />
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:flex dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
