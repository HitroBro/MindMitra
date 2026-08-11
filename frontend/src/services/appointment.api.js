import axiosInstance from './axiosInstance';

export const appointmentApi = {
  create: (data) => axiosInstance.post('/appointments', data),
  getMy: () => axiosInstance.get('/appointments/my'),
  getForCounselor: () => axiosInstance.get('/appointments/counselor'),
  updateStatus: (id, data) => axiosInstance.patch(`/appointments/${id}/status`, data),
  cancel: (id) => axiosInstance.delete(`/appointments/${id}`),
  startSession: (id) => axiosInstance.post(`/appointments/${id}/start`),
  getBySession: (sessionId) => axiosInstance.get(`/appointments/session/${sessionId}`),
  complete: (id) => axiosInstance.patch(`/appointments/${id}/complete`),
  rate: (id, data) => axiosInstance.post(`/appointments/${id}/rate`, data),
  getAll: () => axiosInstance.get('/appointments'),
};
