import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const CreateWorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    setSubmitting(true);
    try {
      const workspace = await createWorkspace({ name, description, isPublic });
      reset();
      onClose();
      onCreated?.(workspace);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Workspace Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Company"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this workspace for?"
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Privacy</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm text-left ${
                !isPublic ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-600"
              }`}
            >
              <span className="font-medium block">Private</span>
              <span className="text-xs text-secondary">Invite-only membership</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm text-left ${
                isPublic ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-600"
              }`}
            >
              <span className="font-medium block">Public</span>
              <span className="text-xs text-secondary">Discoverable via search</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspaceModal;
