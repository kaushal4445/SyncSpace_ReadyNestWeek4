// Formats a message's createdAt into a "Today" / "Yesterday" / "8 July" label,
// used to insert date separators between groups of messages.
export const formatDateSeparator = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";

  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
};

// Groups a flat, chronologically-sorted message list into { dateLabel, messages }
// buckets so the UI can render a separator once per day instead of per message.
export const groupMessagesByDay = (messages) => {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;

  for (const message of messages) {
    const label = formatDateSeparator(message.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(message);
  }

  return groups;
};
