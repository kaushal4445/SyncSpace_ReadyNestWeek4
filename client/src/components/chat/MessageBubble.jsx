import { useNavigate } from "react-router-dom";
import { FiFile, FiImage, FiFileText, FiVideo, FiDownload, FiCheck, FiArchive } from "react-icons/fi";
import { BsCheck2All } from "react-icons/bs";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

const iconForFile = (fileType) => {
  switch (fileType) {
    case "image":
      return <FiImage />;
    case "pdf":
    case "document":
      return <FiFileText />;
    case "video":
      return <FiVideo />;
    case "archive":
      return <FiArchive />;
    default:
      return <FiFile />;
  }
};

const Avatar = ({ user, size = 32 }) => (
  <div
    className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {user?.avatar ? (
      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
    ) : (
      (user?.name || "?").charAt(0).toUpperCase()
    )}
  </div>
);

const DocumentShareCard = ({ doc, isOwn }) => {
  const navigate = useNavigate();
  if (!doc) return null;
  return (
    <div
      className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 ${
        isOwn ? "border-white/30 bg-white/10" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
      }`}
    >
      <FiFileText className={isOwn ? "text-white" : "text-primary"} size={18} />
      <span className={`text-sm font-medium truncate flex-1 ${isOwn ? "text-white" : ""}`}>{doc.title}</span>
      <button
        onClick={() => navigate(`/documents/${doc._id}`)}
        className={`text-xs underline shrink-0 ${isOwn ? "text-white" : "text-primary"}`}
      >
        Open
      </button>
    </div>
  );
};

const AttachmentItem = ({ attachment, isOwn }) => {
  const isImage = attachment.fileType === "image";
  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={attachment.url} alt={attachment.fileName} className="rounded-lg max-h-48 object-cover" />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 ${
        isOwn ? "border-white/30 bg-white/10 text-white" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
      }`}
    >
      <span className={isOwn ? "text-white" : "text-primary"}>{iconForFile(attachment.fileType)}</span>
      <span className="text-xs truncate flex-1">{attachment.fileName}</span>
      <FiDownload size={14} className="shrink-0" />
    </a>
  );
};

const MessageBubble = ({ message, isOwn, showMeta = true, onReact, currentUserId }) => {
  const senderName = message.sender?.name || "Unknown";
  const reactions = message.reactions || [];
  const groupedReactions = reactions.reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || [];
    acc[r.emoji].push(r.user);
    return acc;
  }, {});

  const myReactionEmojis = new Set(
    reactions.filter((r) => (r.user?._id || r.user) === currentUserId).map((r) => r.emoji)
  );

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 group`}>
      {!isOwn && showMeta && (
        <div className="mr-2 mt-4">
          <Avatar user={message.sender} />
        </div>
      )}
      {!isOwn && !showMeta && <div className="w-8 mr-2 shrink-0" />}

      <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && showMeta && <p className="text-xs font-medium text-secondary mb-0.5 ml-1">{senderName}</p>}

        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2 text-sm break-words ${
              isOwn ? "bg-primary text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-700 rounded-bl-sm"
            } ${message.pending ? "opacity-60" : ""} ${message.failed ? "border-2 border-red-400" : ""}`}
          >
            {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
            {message.documentShare && <DocumentShareCard doc={message.documentShare} isOwn={isOwn} />}
            {message.attachments?.map((a, i) => (
              <AttachmentItem key={a.url || i} attachment={a} isOwn={isOwn} />
            ))}
          </div>

          {/* Hover reaction picker */}
          <div
            className={`absolute -top-3 ${isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} hidden group-hover:flex bg-white dark:bg-slate-800 shadow-md rounded-full px-1 py-0.5 gap-0.5 border border-slate-100 dark:border-slate-700 z-10`}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message._id, emoji)}
                className="text-sm hover:scale-125 transition-transform px-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message._id, emoji)}
                className={`text-xs rounded-full px-1.5 py-0.5 border flex items-center gap-1 ${
                  myReactionEmojis.has(emoji)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-secondary mt-1 flex items-center gap-1">
          {message.failed ? (
            <span className="text-red-500">Failed to send</span>
          ) : (
            <>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {isOwn && !message.pending && (
                <span className="flex items-center">
                  {message.seenBy?.length > 0 ? (
                    <BsCheck2All className="text-primary" size={13} />
                  ) : (
                    <FiCheck size={12} />
                  )}
                </span>
              )}
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
