const Meeting = require("../models/Meeting");
const Notification = require("../models/Notification");

// @desc   Get meetings for a workspace
// @route  GET /api/meetings/workspace/:workspaceId
const getWorkspaceMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({ workspace: req.params.workspaceId })
      .sort("scheduledStart")
      .populate("organizer", "name avatar")
      .populate("participants", "name avatar");

    res.status(200).json({ success: true, count: meetings.length, meetings });
  } catch (error) {
    next(error);
  }
};

// @desc   Get upcoming meetings for the logged-in user
// @route  GET /api/meetings/upcoming
const getUpcomingMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({
      participants: req.user._id,
      scheduledStart: { $gte: new Date() },
      status: { $in: ["scheduled", "ongoing"] },
    })
      .sort("scheduledStart")
      .limit(10);

    res.status(200).json({ success: true, meetings });
  } catch (error) {
    next(error);
  }
};

// @desc   Schedule a new meeting (creates meeting + notifications for participants)
// @route  POST /api/meetings
const scheduleMeeting = async (req, res, next) => {
  try {
    const { title, workspace, participants, scheduledStart, scheduledEnd, meetingLink, notes, relatedEvent } =
      req.body;

    const meeting = await Meeting.create({
      title,
      workspace,
      organizer: req.user._id,
      participants: participants || [],
      scheduledStart,
      scheduledEnd,
      meetingLink,
      notes,
      relatedEvent,
    });

    if (Array.isArray(participants) && participants.length) {
      const reminderDocs = participants.map((userId) => ({
        recipient: userId,
        sender: req.user._id,
        type: "meeting_reminder",
        message: `You've been invited to "${title}"`,
        relatedWorkspace: workspace,
      }));
      await Notification.insertMany(reminderDocs);
    }

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

// @desc   Update meeting (details or status)
// @route  PUT /api/meetings/:id
const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    Object.assign(meeting, req.body);
    await meeting.save();

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

// @desc   Cancel/delete a meeting
// @route  DELETE /api/meetings/:id
const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    await meeting.deleteOne();
    res.status(200).json({ success: true, message: "Meeting cancelled" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkspaceMeetings, getUpcomingMeetings, scheduleMeeting, updateMeeting, deleteMeeting };
