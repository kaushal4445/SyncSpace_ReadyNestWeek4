import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiFileText } from "react-icons/fi";
import Modal from "../ui/Modal.jsx";
import { documentService } from "../../services/documentService.js";
import useDebounce from "../../hooks/useDebounce.js";

// Attachment -> Documents -> choose a document -> send. Lets a user share an
// existing workspace document straight into a chat conversation.
const DocumentPickerModal = ({
  isOpen,
  onClose,
  workspaceId,
  onPick,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!isOpen || disabled || !workspaceId) {
      if (!isOpen) setSearch("");
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await documentService.getByWorkspace(workspaceId, {
          search: debouncedSearch || undefined,
        });
        if (!cancelled) setDocuments(data.documents || []);
      } catch (error) {
        if (!cancelled) toast.error("Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, workspaceId, debouncedSearch]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share a document">
      {!disabled && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full border border-slate-200 dark:border-slate-600 bg-transparent rounded-lg px-3 py-2 text-sm outline-none mb-3"
          autoFocus
        />
      )}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
        {disabled && (
          <p className="text-xs text-secondary p-3">
            Document sharing is available in workspace chats only.
          </p>
        )}
        {!disabled && loading && (
          <p className="text-xs text-secondary p-3">Loading...</p>
        )}
        {!disabled && !loading && documents.length === 0 && (
          <p className="text-xs text-secondary p-3">
            No documents found in this workspace.
          </p>
        )}
        {!disabled &&
          !loading &&
          documents.map((doc) => (
            <button
              key={doc._id}
              onClick={() => {
                onPick(doc);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
            >
              <FiFileText className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-secondary">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
      </div>
    </Modal>
  );
};

export default DocumentPickerModal;
