const EventCard = ({ event, onClick }) => (
  <button
    onClick={() => onClick?.(event)}
    style={{ borderLeftColor: event.color || "#3B82F6" }}
    className="w-full text-left text-xs px-2 py-1 rounded-md bg-primary/10 border-l-4 mb-1 truncate hover:bg-primary/20"
  >
    <span className="font-medium">{event.title}</span>
    {!event.isAllDay && (
      <span className="text-secondary ml-1">
        {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    )}
  </button>
);

export default EventCard;
