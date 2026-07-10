import { FiFileText, FiShare2, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";

const DocumentCard = ({ document, onClick, onShare, onHistory }) => (
  <motion.div
    layout
    whileHover={{ y: -2 }}
    onClick={onClick}
    className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 cursor-pointer flex flex-col gap-2"
  >
    <div className="flex items-center gap-2 text-primary">
      <FiFileText />
      <h3 className="font-semibold truncate">{document.title}</h3>
    </div>
    <p className="text-xs text-secondary line-clamp-2">
      {document.content ? document.content.replace(/<[^>]+>/g, "").slice(0, 100) : "Empty document"}
    </p>
    <div className="flex items-center justify-between mt-2 text-xs text-secondary">
      <span>{document.lastEditedBy?.name || document.createdBy?.name || "Unknown"}</span>
      <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
    </div>
    <div className="flex gap-3 mt-1">
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
