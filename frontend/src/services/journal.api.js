import axiosInstance from './axiosInstance';

export const journalApi = {
  create: (data) => axiosInstance.post('/journals', data),
  getMy: () => axiosInstance.get('/journals/my'),
  getById: (id) => axiosInstance.get(`/journals/${id}`),
  update: (id, data) => axiosInstance.patch(`/journals/${id}`, data),
  delete: (id) => axiosInstance.delete(`/journals/${id}`),
};
