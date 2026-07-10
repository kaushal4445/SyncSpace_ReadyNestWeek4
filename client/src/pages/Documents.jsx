import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import DocumentCard from "../components/documents/DocumentCard.jsx";
import ShareModal from "../components/documents/ShareModal.jsx";
import VersionHistoryModal from "../components/documents/VersionHistoryModal.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { documentService } from "../services/documentService.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

const Documents = () => {
  const { currentWorkspace } = useWorkspace() || {};
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shareTarget, setShareTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const { data } = await documentService.getByWorkspace(currentWorkspace._id, {
        search: debouncedSearch || undefined,
      });
      setDocuments(data.documents);
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace, debouncedSearch]);

  const handleCreate = async () => {
    if (!currentWorkspace) return;
    try {
      const { data } = await documentService.create({ title: "Untitled Document", workspace: currentWorkspace._id });
      navigate(`/documents/${data.document._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create document");
    }
  };

  if (!currentWorkspace) {
    return <EmptyState title="No workspace selected" description="Create or select a workspace to see its documents." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
            <FiSearch className="text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <FiPlus /> New Document
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Create your first document to start collaborating."
          action={<Button onClick={handleCreate}>Create Document</Button>}
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onClick={() => navigate(`/documents/${doc._id}`)}
              onShare={setShareTarget}
              onHistory={setHistoryTarget}
            />
          ))}
        </motion.div>
      )}

      <ShareModal
        document={shareTarget}
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        onUpdated={(updated) => setDocuments((prev) => prev.map((d) => (d._id === updated._id ? updated : d)))}
      />
      <VersionHistoryModal
        document={historyTarget}
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        onRestored={fetchDocuments}
      />
    </div>
  );
};

export default Documents;
