import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FileUploadDropzone from "../components/files/FileUploadDropzone.jsx";
import FileCard from "../components/files/FileCard.jsx";
import StorageStats from "../components/files/StorageStats.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { fileService } from "../services/fileService.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

const CATEGORIES = ["all", "general", "images", "documents", "media"];

const Files = () => {
  const { currentWorkspace } = useWorkspace() || {};
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        fileService.getByWorkspace(currentWorkspace._id, category !== "all" ? { category } : {}),
        fileService.getStats(currentWorkspace._id),
      ]);
      setFiles(filesRes.data.files);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace, category]);

  const handleDelete = async (file) => {
    if (!confirm(`Delete "${file.originalName}"?`)) return;
    await fileService.remove(file._id);
    setFiles((prev) => prev.filter((f) => f._id !== file._id));
    toast.success("File deleted");
  };

  if (!currentWorkspace) {
    return <EmptyState title="No workspace selected" description="Select a workspace to manage its files." />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">File Manager</h1>

      <FileUploadDropzone
        workspaceId={currentWorkspace._id}
        onUploaded={(newFiles) => setFiles((prev) => [...newFiles, ...prev])}
      />

      <StorageStats stats={stats} />

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize ${
              category === c ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-secondary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState title="No files yet" description="Upload your first file to get started." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard key={file._id} file={file} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Files;
