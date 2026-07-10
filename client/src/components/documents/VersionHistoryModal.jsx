import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { documentService } from "../../services/documentService.js";

const VersionHistoryModal = ({ document, isOpen, onClose, onRestored }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !document) return;
    setLoading(true);
    documentService
      .getVersions(document._id)
      .then(({ data }) => setVersions(data.versionHistory))
      .finally(() => setLoading(false));
  }, [isOpen, document]);

  const handleRestore = async (versionId) => {
    try {
      const { data } = await documentService.restoreVersion(document._id, versionId);
      toast.success("Version restored");
      onRestored?.(data.document);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Version History — ${document?.title}`} maxWidth="max-w-xl">
      {loading ? (
        <p className="text-sm text-secondary">Loading versions...</p>
      ) : versions.length === 0 ? (
        <EmptyState title="No previous versions" description="Edits to this document will appear here." />
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {versions
            .slice()
            .reverse()
            .map((v) => (
              <div key={v._id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-secondary">{new Date(v.editedAt).toLocaleString()}</p>
                  <p className="text-sm truncate">{v.content?.replace(/<[^>]+>/g, "").slice(0, 80) || "(empty)"}</p>
                </div>
                <Button variant="secondary" onClick={() => handleRestore(v._id)}>
                  Restore
                </Button>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
};

export default VersionHistoryModal;
