import { FiVideo, FiClock } from "react-icons/fi";

const MeetingCard = ({ meeting }) => (
  <div className="border rounded-lg p-3 flex items-start gap-3">
    <div className="bg-primary/10 text-primary rounded-lg p-2">
      <FiVideo />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium truncate">{meeting.title}</p>
      <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
        <FiClock size={12} />
        {new Date(meeting.scheduledStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
      </p>
      {meeting.meetingLink && (
        <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
          Join meeting
        </a>
      )}
    </div>
    <span className="text-[10px] capitalize bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{meeting.status}</span>
  </div>
);

export default MeetingCard;
