import axiosInstance from './axiosInstance';

export const resourceApi = {
  upload: (formData) => axiosInstance.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => axiosInstance.get('/resources', { params }),
  getById: (id) => axiosInstance.get(`/resources/${id}`),
  delete: (id) => axiosInstance.delete(`/resources/${id}`),
  trackDownload: (id) => axiosInstance.post(`/resources/${id}/download`),
};
