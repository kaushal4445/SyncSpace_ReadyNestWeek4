import api from "./api";

export const documentService = {
  getRecent: () => api.get("/documents/recent"),
  getByWorkspace: (workspaceId, params = {}) => api.get(`/documents/workspace/${workspaceId}`, { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (payload) => api.post("/documents", payload),
  update: (id, payload) => api.put(`/documents/${id}`, payload),
  remove: (id) => api.delete(`/documents/${id}`),
  share: (id, payload) => api.post(`/documents/${id}/share`, payload),
  updateShareRole: (id, userId, role) => api.put(`/documents/${id}/share/${userId}`, { role }),
  removeShareAccess: (id, userId) => api.delete(`/documents/${id}/share/${userId}`),
  getVersions: (id) => api.get(`/documents/${id}/versions`),
  restoreVersion: (id, versionId) => api.post(`/documents/${id}/versions/${versionId}/restore`),
  exportPdfUrl: (id) => `/api/documents/${id}/export-pdf`,
};
