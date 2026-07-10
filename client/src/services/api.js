import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Session-expiry handling: broadcast a window event so AuthContext can clear
// state and redirect to /login without creating a circular import between
// the axios instance and the React context.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
