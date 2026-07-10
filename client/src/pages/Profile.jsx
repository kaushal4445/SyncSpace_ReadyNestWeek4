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
      await api.put("/auth/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar upload failed");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex items-center gap-4">
        <div className="relative">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`}
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
          <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer">
            <FiCamera size={14} />
            <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </label>
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-secondary">{user?.email}</p>
          <p className="text-xs text-secondary capitalize mt-1">Role: {user?.role}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-3">
        <p className="text-sm font-semibold">Account Information</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-lg px-3 py-2 text-sm" />
        <Button type="submit" disabled={savingProfile}>
          {savingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-3">
        <p className="text-sm font-semibold">Change Password</p>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={savingPassword} variant="secondary">
          {savingPassword ? "Updating..." : "Update Password"}
        </Button>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <p className="text-sm font-semibold mb-2">Activity Timeline</p>
        <p className="text-xs text-secondary">
          Detailed activity history (logins, edits, uploads) will appear here once the activity-log endpoint is added.
        </p>
      </div>
    </div>
  );
};

export default Profile;
