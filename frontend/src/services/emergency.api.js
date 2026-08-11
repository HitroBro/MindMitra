import axiosInstance from './axiosInstance';

export const emergencyApi = {
  trigger: (context) => axiosInstance.post('/emergency/trigger', { context }),
  getAll: (params) => axiosInstance.get('/emergency', { params }),
  resolve: (id) => axiosInstance.patch(`/emergency/${id}/resolve`),
};
