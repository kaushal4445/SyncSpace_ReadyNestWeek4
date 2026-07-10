import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { socket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/auth/profile");
      setUser(data.user);
      socket.connect();
      socket.emit("user_online", data.user.id);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handles expired/invalid sessions: any 401 from the API (see services/api.js)
  // clears local state, disconnects the socket, and drops the user back on Login.
  useEffect(() => {
    const handleExpired = () => {
      setUser((prev) => {
        if (prev) toast.error("Your session has expired. Please log in again.");
        return null;
      });
      socket.disconnect();
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    socket.connect();
    socket.emit("user_online", data.user.id);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setUser(data.user);
    socket.connect();
    socket.emit("user_online", data.user.id);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      socket.disconnect();
      setUser(null);
    }
  };

  // Lets pages (e.g. Settings, Profile) merge partial updates into the cached user object
  // after a successful API call, without re-fetching the whole profile.
  const updateUser = (partial) => setUser((prev) => (prev ? { ...prev, ...partial } : prev));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
