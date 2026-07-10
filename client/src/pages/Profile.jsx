import { useState } from "react";
import toast from "react-hot-toast";
import { FiCamera } from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/auth/profile", { name, email });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await api.put("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar upload failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Profile
      </h1>

      <div className="surface-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="relative">
          <img
            src={
              avatarPreview ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`
            }
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
          <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer">
            <FiCamera size={14} />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {user?.name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>
          <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
            Role: {user?.role}
          </p>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="surface-card space-y-3 p-6">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Account Information
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="input-field"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
        <Button type="submit" disabled={savingProfile}>
          {savingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <form
        onSubmit={handlePasswordChange}
        className="surface-card space-y-3 p-6"
      >
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Change Password
        </p>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
          className="input-field"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="input-field"
        />
        <Button type="submit" disabled={savingPassword} variant="secondary">
          {savingPassword ? "Updating..." : "Update Password"}
        </Button>
      </form>

      <div className="surface-card p-6">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Activity Timeline
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Detailed activity history (logins, edits, uploads) will appear here
          once the activity-log endpoint is added.
        </p>
      </div>
    </div>
  );
};

export default Profile;
