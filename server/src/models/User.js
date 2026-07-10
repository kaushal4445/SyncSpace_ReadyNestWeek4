const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active" },
    // Settings module: dark mode, notification/privacy/security toggles
    preferences: {
      darkMode: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      mentionNotifications: { type: Boolean, default: true },
      meetingReminders: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ["public", "workspace_only", "private"], default: "workspace_only" },
      twoFactorEnabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    // login/register have always returned { id: user._id, ... } to the client,
    // and the whole frontend (AuthContext, Chat's isOwn check, ShareModal,
    // etc.) relies on user.id. But endpoints that instead return the raw
    // Mongoose document (getProfile, updateProfile, updateAvatar,
    // updatePreferences) only had _id, not id — so req.user.id was undefined
    // after GET /api/auth/profile, which runs on every page load/refresh.
    // That undefined id was then sent as the socket "sender" field (rejected
    // by socketHandler's validation as "Missing or invalid sender") and made
    // every message's isOwn check false, left-aligning everything. Enabling
    // virtuals here makes `id` consistently present on every serialized User
    // document, matching what login/register already produced.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);