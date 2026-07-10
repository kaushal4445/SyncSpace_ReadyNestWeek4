const express = require("express");
const {
  getWorkspaceMeetings,
  getUpcomingMeetings,
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const { protect } = require("../middleware/authMiddleware");
const { requireWorkspaceMember } = require("../middleware/workspaceAuth");

const router = express.Router();

router.use(protect);

router.get("/upcoming", getUpcomingMeetings);
router.get("/workspace/:workspaceId", requireWorkspaceMember, getWorkspaceMeetings);
router.post("/", scheduleMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

module.exports = router;
