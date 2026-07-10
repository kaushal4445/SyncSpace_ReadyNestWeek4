import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "./AuthContext.jsx";

const WorkspaceContext = createContext(null);

// Local storage key used only to remember *which* workspace id was last
// selected, so a page refresh doesn't silently fall back to workspaces[0].
const LAST_WORKSPACE_KEY = "syncspace:lastWorkspaceId";

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setCurrentWorkspace = useCallback((workspace) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) localStorage.setItem(LAST_WORKSPACE_KEY, workspace._id);
    else localStorage.removeItem(LAST_WORKSPACE_KEY);
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const { data } = await api.get("/workspaces");
      setWorkspaces(data.workspaces);
      setCurrentWorkspaceState((prev) => {
        if (prev) {
          // Keep the same workspace selected, but refresh it with the latest data
          const refreshed = data.workspaces.find((w) => w._id === prev._id);
          return refreshed || data.workspaces[0] || null;
        }
        const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
        const remembered = lastId && data.workspaces.find((w) => w._id === lastId);
        return remembered || data.workspaces[0] || null;
      });
    } catch (error) {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchWorkspaces();
    else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
    }
  }, [user, fetchWorkspaces]);

  const createWorkspace = useCallback(async (payload) => {
    const { data } = await api.post("/workspaces", payload);
    setWorkspaces((prev) => [...prev, data.workspace]);
    setCurrentWorkspace(data.workspace);
    toast.success(`"${data.workspace.name}" created`);
    return data.workspace;
  }, [setCurrentWorkspace]);

  const joinWorkspaceByCode = useCallback(async (inviteCode) => {
    const { data } = await api.post("/workspaces/join", { inviteCode });
    setWorkspaces((prev) => {
      const exists = prev.some((w) => w._id === data.workspace._id);
      return exists ? prev.map((w) => (w._id === data.workspace._id ? data.workspace : w)) : [...prev, data.workspace];
    });
    setCurrentWorkspace(data.workspace);
    toast.success(`Joined "${data.workspace.name}"`);
    return data.workspace;
  }, [setCurrentWorkspace]);

  const updateWorkspace = useCallback(async (id, payload) => {
    const { data } = await api.put(`/workspaces/${id}`, payload);
    setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
    setCurrentWorkspaceState((prev) => (prev && prev._id === id ? data.workspace : prev));
    toast.success("Workspace updated");
    return data.workspace;
  }, []);

  const deleteWorkspace = useCallback(async (id) => {
    await api.delete(`/workspaces/${id}`);
    setWorkspaces((prev) => {
      const remaining = prev.filter((w) => w._id !== id);
      setCurrentWorkspaceState((current) => {
        if (current?._id !== id) return current;
        const next = remaining[0] || null;
        if (next) localStorage.setItem(LAST_WORKSPACE_KEY, next._id);
        else localStorage.removeItem(LAST_WORKSPACE_KEY);
        return next;
      });
      return remaining;
    });
    toast.success("Workspace deleted");
  }, []);

  const leaveWorkspace = useCallback(async (id) => {
    await api.post(`/workspaces/${id}/leave`);
    setWorkspaces((prev) => {
      const remaining = prev.filter((w) => w._id !== id);
      setCurrentWorkspaceState((current) => {
        if (current?._id !== id) return current;
        const next = remaining[0] || null;
        if (next) localStorage.setItem(LAST_WORKSPACE_KEY, next._id);
        else localStorage.removeItem(LAST_WORKSPACE_KEY);
        return next;
      });
      return remaining;
    });
    toast.success("Left workspace");
  }, []);

  const inviteMember = useCallback(async (id, payload) => {
    const { data } = await api.post(`/workspaces/${id}/invite`, payload);
    setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
    setCurrentWorkspaceState((prev) => (prev && prev._id === id ? data.workspace : prev));
    toast.success("Member invited");
    return data.workspace;
  }, []);

  const removeMember = useCallback(async (id, userId) => {
    const { data } = await api.delete(`/workspaces/${id}/members/${userId}`);
    setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
    setCurrentWorkspaceState((prev) => (prev && prev._id === id ? data.workspace : prev));
    toast.success("Member removed");
    return data.workspace;
  }, []);

  const changeMemberRole = useCallback(async (id, userId, role) => {
    const { data } = await api.put(`/workspaces/${id}/members/${userId}/role`, { role });
    setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
    setCurrentWorkspaceState((prev) => (prev && prev._id === id ? data.workspace : prev));
    toast.success("Role updated");
    return data.workspace;
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        refreshWorkspaces: fetchWorkspaces,
        createWorkspace,
        joinWorkspaceByCode,
        updateWorkspace,
        deleteWorkspace,
        leaveWorkspace,
        inviteMember,
        removeMember,
        changeMemberRole,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
