import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import ToggleSwitch from "../components/ui/ToggleSwitch.jsx";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { currentWorkspace } = useWorkspace() || {};
  const [prefs, setPrefs] = useState(
    user?.preferences || {
      darkMode: false,
      emailNotifications: true,
      mentionNotifications: true,
      meetingReminders: true,
      profileVisibility: "workspace_only",
      twoFactorEnabled: false,
    },
  );

  // Apply dark mode to <html> so Tailwind's `dark:` classes take effect app-wide
  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!prefs.darkMode);
  }, [prefs.darkMode]);

  const persist = async (nextPrefs) => {
    setPrefs(nextPrefs);
    try {
      const { data } = await api.put("/auth/preferences", nextPrefs);
      updateUser({ preferences: data.preferences });
    } catch (error) {
      toast.error("Failed to save setting");
    }
  };

  const Section = ({ title, children }) => (
    <div className="surface-card p-5 sm:p-6">
      <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </p>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {children}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Settings
      </h1>

      <Section title="Appearance">
        <ToggleSwitch
          label="Dark Mode"
          description="Switch the whole app to a dark, low-glare theme"
          checked={prefs.darkMode}
          onChange={(val) => persist({ ...prefs, darkMode: val })}
        />
      </Section>

      <Section title="Notifications">
        <ToggleSwitch
          label="Email Notifications"
          description="Receive a summary email for important activity"
          checked={prefs.emailNotifications}
          onChange={(val) => persist({ ...prefs, emailNotifications: val })}
        />
        <ToggleSwitch
          label="Mention Notifications"
          description="Get notified when someone @mentions you"
          checked={prefs.mentionNotifications}
          onChange={(val) => persist({ ...prefs, mentionNotifications: val })}
        />
        <ToggleSwitch
          label="Meeting Reminders"
          description="Reminders before scheduled meetings"
          checked={prefs.meetingReminders}
          onChange={(val) => persist({ ...prefs, meetingReminders: val })}
        />
      </Section>

      <Section title="Privacy">
        <div className="py-3">
          <p className="text-sm font-medium mb-2">Profile Visibility</p>
          <select
            value={prefs.profileVisibility}
            onChange={(e) =>
              persist({ ...prefs, profileVisibility: e.target.value })
            }
            className="input-field"
          >
            <option value="public">Public</option>
            <option value="workspace_only">Workspace members only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </Section>

      <Section title="Security">
        <ToggleSwitch
          label="Two-Factor Authentication"
          description="Extra layer of protection (email/OTP integration is a future enhancement)"
          checked={prefs.twoFactorEnabled}
          onChange={(val) => persist({ ...prefs, twoFactorEnabled: val })}
        />
      </Section>

      {currentWorkspace && (
        <Section title="Workspace Preferences">
          <p className="text-xs text-secondary py-2">
            Managing <strong>{currentWorkspace.name}</strong>'s settings (public
            access, invite permissions) is available to workspace admins from
            the Workspace settings modal.
          </p>
        </Section>
      )}
    </div>
  );
};

export default Settings;
