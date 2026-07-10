const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
    meetingLink: { type: String, default: "" },
    notes: { type: String, default: "" },
    relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarEvent" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
