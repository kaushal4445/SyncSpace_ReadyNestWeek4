import api from "./api";

export const analyticsService = {
  getDashboard: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/dashboard`),
  getGrowth: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/growth`),
  getChatStats: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/chat-stats`),
  getMeetingStats: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/meeting-stats`),
  getStorageUsage: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/storage`),
  getTeamActivity: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}/team-activity`),
};
