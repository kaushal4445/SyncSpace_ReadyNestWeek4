import { FiFileText, FiShare2, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";

const DocumentCard = ({ document, onClick, onShare, onHistory }) => (
  <motion.div
    layout
    whileHover={{ y: -2 }}
    onClick={onClick}
    className="surface-card flex cursor-pointer flex-col gap-3 p-4"
  >
    <div className="flex items-center gap-2 text-primary">
      <FiFileText />
      <h3 className="truncate font-semibold text-slate-900 dark:text-white">
        {document.title}
      </h3>
    </div>
    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
      {document.content
        ? document.content.replace(/<[^>]+>/g, "").slice(0, 100)
        : "Empty document"}
    </p>
    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="truncate">
        {document.lastEditedBy?.name || document.createdBy?.name || "Unknown"}
      </span>
      <span className="shrink-0">
        {new Date(document.updatedAt).toLocaleDateString()}
      </span>
    </div>
    <div className="mt-1 flex flex-wrap gap-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare?.(document);
        }}
        className="text-xs flex items-center gap-1 text-secondary hover:text-primary"
      >
        <FiShare2 /> Share
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onHistory?.(document);
        }}
        className="text-xs flex items-center gap-1 text-secondary hover:text-primary"
      >
        <FiClock /> History
      </button>
    </div>
  </motion.div>
);

export default DocumentCard;
