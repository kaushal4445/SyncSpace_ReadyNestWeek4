const CalendarEvent = require("../models/CalendarEvent");

// @desc   Get events in a date range for a workspace (drives month/week/day views)
// @route  GET /api/events/workspace/:workspaceId?from=&to=
const getEvents = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { workspace: req.params.workspaceId };

    if (from && to) {
      filter.startTime = { $gte: new Date(from) };
      filter.endTime = { $lte: new Date(to) };
    }

    const events = await CalendarEvent.find(filter)
      .sort("startTime")
      .populate("createdBy", "name avatar")
      .populate("attendees", "name avatar");

    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
};

// @desc   Get today's events/tasks for the logged-in user
// @route  GET /api/events/today
const getTodayEvents = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const events = await CalendarEvent.find({
      attendees: req.user._id,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort("startTime");

    res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

// @desc   Get upcoming events (next 7 days) for the logged-in user
// @route  GET /api/events/upcoming
const getUpcomingEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await CalendarEvent.find({
      attendees: req.user._id,
      startTime: { $gte: now, $lte: sevenDaysOut },
    })
      .sort("startTime")
      .limit(10);

    res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

// @desc   Create calendar event
// @route  POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc   Update calendar event
// @route  PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete calendar event
// @route  DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getTodayEvents, getUpcomingEvents, createEvent, updateEvent, deleteEvent };
