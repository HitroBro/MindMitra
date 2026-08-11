import axiosInstance from './axiosInstance';

export const reportApi = {
  create: (data) => axiosInstance.post('/reports', data),
  getMy: () => axiosInstance.get('/reports/my'),
  getAll: (params) => axiosInstance.get('/reports', { params }),
  update: (id, data) => axiosInstance.patch(`/reports/${id}`, data),
};

export const feedbackApi = {
  create: (data) => axiosInstance.post('/feedback', data),
  getAll: () => axiosInstance.get('/feedback'),
};
