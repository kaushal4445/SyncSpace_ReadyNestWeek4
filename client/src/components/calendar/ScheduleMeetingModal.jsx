import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { calendarService, meetingService } from "../../services/calendarService.js";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const ScheduleMeetingModal = ({ isOpen, onClose, workspaceId, defaultDate, onCreated }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("meeting"); // meeting | task | reminder
  const [start, setStart] = useState(defaultDate || "");
  const [end, setEnd] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setStart("");
    setEnd("");
    setMeetingLink("");
  };

  const handleSubmit = async () => {
    if (!title || !start || !end) {
      toast.error("Title, start, and end time are required");
      return;
    }
    setSaving(true);
    try {
      const eventPayload = {
        title,
        workspace: workspaceId,
        startTime: start,
        endTime: end,
        eventType: type,
        color,
        meetingLink,
        attendees: [],
      };
      const { data } = await calendarService.createEvent(eventPayload);

      if (type === "meeting") {
        await meetingService.schedule({
          title,
          workspace: workspaceId,
          scheduledStart: start,
          scheduledEnd: end,
          meetingLink,
          relatedEvent: data.event._id,
        });
      }

      toast.success("Scheduled successfully");
      onCreated?.(data.event);
      reset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting / Event">
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-secondary">Start</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-secondary">End</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="meeting">Meeting</option>
          <option value="task">Task</option>
          <option value="reminder">Reminder</option>
        </select>

        {type === "meeting" && (
          <input
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Meeting link (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">Color</span>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
            />
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? "Scheduling..." : "Schedule"}
        </Button>
      </div>
    </Modal>
  );
};

export default ScheduleMeetingModal;
