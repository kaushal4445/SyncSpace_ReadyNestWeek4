const crypto = require("crypto");
const User = require("../models/User");
const { generateToken, sendTokenCookie } = require("../utils/generateToken");

// @desc   Register new user
// @route  POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Logout user
// @route  POST /api/auth/logout
const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.isOnline = false;
      req.user.lastSeen = Date.now();
      await req.user.save();
    }
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc   Get logged-in user profile
// @route  GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc   Forgot password - generate reset token
// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // TODO: integrate email service (e.g. Nodemailer/SendGrid) to send resetToken link
    res.status(200).json({ success: true, message: "Password reset token generated", resetToken });
  } catch (error) {
    next(error);
  }
};

// @desc   Reset password using token
// @route  POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

// @desc   Update profile fields (name, email) — password changes go through changePassword
// @route  PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (name) req.user.name = name;
    if (email) req.user.email = email;

    await req.user.save();
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc   Change password for the logged-in user
// @route  PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc   Upload/replace avatar (expects Cloudinary upload result URL from uploadMiddleware flow)
// @route  PUT /api/auth/avatar
const updateAvatar = async (req, res, next) => {
  try {
    const cloudinary = require("../config/cloudinary");
    const streamifier = require("streamifier");

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "syncspace/avatars", resource_type: "image" },
        (error, uploadResult) => (uploadResult ? resolve(uploadResult) : reject(error))
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    req.user.avatar = result.secure_url;
    await req.user.save();

    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc   Update user preferences (dark mode, notification/privacy/security settings)
// @route  PUT /api/auth/preferences
const updatePreferences = async (req, res, next) => {
  try {
    req.user.preferences = { ...req.user.preferences?.toObject?.(), ...req.body };
    await req.user.save();
    res.status(200).json({ success: true, preferences: req.user.preferences });
  } catch (error) {
    next(error);
  }
};

// @desc   Get a single user's public profile (used e.g. to open a direct chat from search)
// @route  GET /api/auth/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("name email avatar isOnline lastSeen");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
