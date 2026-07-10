import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const JoinWorkspaceModal = ({ isOpen, onClose }) => {
  const { joinWorkspaceByCode } = useWorkspace();
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setInviteCode("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Enter an invite code");
      return;
    }
    setSubmitting(true);
    try {
      await joinWorkspaceByCode(inviteCode.trim());
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid invite code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Join Workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Invite Code</label>
          <input
            autoFocus
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Paste the invite code you were given"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-secondary mt-1">
            Ask a workspace admin for the invite code from their Workspace Settings panel.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Joining..." : "Join Workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinWorkspaceModal;
