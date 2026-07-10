import {
  FiFile,
  FiImage,
  FiFileText,
  FiVideo,
  FiDownload,
  FiTrash2,
  FiArchive,
  FiEye,
} from "react-icons/fi";

const iconFor = (fileType) => {
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

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPreviewable = (fileType) =>
  ["image", "pdf", "video"].includes(fileType);

const FileCard = ({ file, onDelete }) => (
  <div className="surface-card flex flex-col gap-2 p-4 transition-shadow hover:shadow-md">
    {file.fileType === "image" ? (
      <img
        src={file.url}
        alt={file.originalName}
        className="h-28 w-full object-cover rounded-lg"
      />
    ) : (
      <div className="h-28 flex items-center justify-center text-4xl text-primary bg-slate-50 dark:bg-slate-700 rounded-lg">
        {iconFor(file.fileType)}
      </div>
    )}
    <p className="text-sm font-medium truncate">{file.originalName}</p>
    <div className="flex items-center justify-between text-xs text-secondary">
      <span>{formatSize(file.fileSize)}</span>
      <span className="capitalize">{file.category}</span>
    </div>
    <div className="flex gap-3 mt-1">
      {isPreviewable(file.fileType) && (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs flex items-center gap-1 text-secondary hover:text-primary"
        >
          <FiEye /> Preview
        </a>
      )}
      <a
        href={file.url}
        download={file.originalName}
        target="_blank"
        rel="noreferrer"
        className="text-xs flex items-center gap-1 text-secondary hover:text-primary"
      >
        <FiDownload /> Download
      </a>
      <button
        onClick={() => onDelete?.(file)}
        className="text-xs flex items-center gap-1 text-secondary hover:text-red-500"
      >
        <FiTrash2 /> Delete
      </button>
    </div>
  </div>
);

export default FileCard;
