import api from "./api";

export const calendarService = {
  getEvents: (workspaceId, params = {}) => api.get(`/events/workspace/${workspaceId}`, { params }),
  getToday: () => api.get("/events/today"),
  getUpcoming: () => api.get("/events/upcoming"),
  createEvent: (payload) => api.post("/events", payload),
  updateEvent: (id, payload) => api.put(`/events/${id}`, payload),
  removeEvent: (id) => api.delete(`/events/${id}`),
};

export const meetingService = {
  getByWorkspace: (workspaceId) => api.get(`/meetings/workspace/${workspaceId}`),
  getUpcoming: () => api.get("/meetings/upcoming"),
  schedule: (payload) => api.post("/meetings", payload),
  update: (id, payload) => api.put(`/meetings/${id}`, payload),
  cancel: (id) => api.delete(`/meetings/${id}`),
};
