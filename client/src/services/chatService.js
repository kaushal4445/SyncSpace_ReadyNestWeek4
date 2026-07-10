import api from "./api";

export const chatService = {
  getConversations: () => api.get("/messages/conversations"),
  getWorkspaceMessages: (workspaceId, params = {}) => api.get(`/messages/workspace/${workspaceId}`, { params }),
  getPrivateMessages: (userId, params = {}) => api.get(`/messages/private/${userId}`, { params }),
  search: (params) => api.get("/messages/search", { params }),
  getUnreadCount: () => api.get("/messages/unread-count"),
};
