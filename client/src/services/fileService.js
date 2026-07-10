import api from "./api";

export const fileService = {
  getByWorkspace: (workspaceId, params = {}) => api.get(`/files/workspace/${workspaceId}`, { params }),
  getStats: (workspaceId) => api.get(`/files/workspace/${workspaceId}/stats`),
  upload: (workspaceId, formData, onUploadProgress) =>
    api.post(`/files/workspace/${workspaceId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  uploadToChat: (formData, onUploadProgress) =>
    api.post(`/files/chat`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  remove: (id) => api.delete(`/files/${id}`),
};
