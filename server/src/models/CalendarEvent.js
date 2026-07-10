const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    eventType: { type: String, enum: ["meeting", "task", "reminder"], default: "meeting" },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    location: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    color: { type: String, default: "#3B82F6" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
