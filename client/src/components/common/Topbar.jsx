import { FiMenu } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

const Topbar = ({ onOpenMobileSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button className="md:hidden text-secondary shrink-0" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <FiMenu size={22} />
        </button>
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <NotificationDropdown />
        <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
      </div>
    </header>
  );
};

export default Topbar;
