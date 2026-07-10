import MeetingCard from "./MeetingCard.jsx";

const UpcomingMeetings = ({ meetings }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
    <p className="text-sm font-semibold mb-3">Upcoming Meetings</p>
    {meetings.length === 0 ? (
      <p className="text-xs text-secondary">No upcoming meetings.</p>
    ) : (
      <div className="space-y-2">
        {meetings.map((m) => (
          <MeetingCard key={m._id} meeting={m} />
        ))}
      </div>
    )}
  </div>
);

export default UpcomingMeetings;
