const express = require("express");
const { body } = require("express-validator");
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  getUserById,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  updateAvatar,
  updatePreferences,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile);
router.get("/users/:id", protect, getUserById);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Profile & Settings modules (added on top of existing auth functionality)
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/preferences", protect, updatePreferences);

module.exports = router;
