const express = require("express");
const {
  getEvents,
  getTodayEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/calendarController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);

router.get("/today", getTodayEvents);
router.get("/upcoming", getUpcomingEvents);
router.get("/workspace/:workspaceId", requireWorkspaceMember, getEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;
