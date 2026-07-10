import { FiHash, FiMessageCircle } from "react-icons/fi";

const Avatar = ({ user, size = 32 }) => (
  <div
    className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {user?.avatar ? (
      <img
        src={user.avatar}
        alt={user.name}
        className="w-full h-full object-cover"
      />
    ) : (
      (user?.name || "?").charAt(0).toUpperCase()
    )}
  </div>
);

const ConversationList = ({
  conversations,
  activeUserId,
  onSelect,
  workspaceChannel,
  onSelectWorkspace,
  workspaceName,
  hiddenOnMobile,
}) => (
  <div
    className={`w-full shrink-0 border-r border-slate-100 dark:border-slate-700 flex-col sm:w-72 ${
      hiddenOnMobile ? "hidden sm:flex" : "flex"
    }`}
  >
    {workspaceName ? (
      <button
        onClick={onSelectWorkspace}
        className={`text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
          workspaceChannel ? "bg-primary/5" : ""
        }`}
      >
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
          <FiHash size={13} /> {workspaceName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Everyone in this workspace
        </p>
      </button>
    ) : (
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No workspace selected
        </p>
      </div>
    )}

    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4">
          <FiMessageCircle className="mb-2 text-3xl text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No conversations
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Start chatting with your teammates.
          </p>
        </div>
      ) : (
        conversations.map((c) => (
          <button
            key={c.user._id}
            onClick={() => onSelect(c.user)}
            className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${
              activeUserId === c.user._id ? "bg-primary/5" : ""
            }`}
          >
            <div className="relative shrink-0">
              <Avatar user={c.user} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                  c.user.isOnline ? "bg-green-500" : "bg-slate-300"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{c.user.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {c.lastMessage?.content || "No messages yet"}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="bg-primary text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                {c.unreadCount}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  </div>
);

export default ConversationList;
