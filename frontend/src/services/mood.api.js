import axiosInstance from './axiosInstance';

export const moodApi = {
  log: (data) => axiosInstance.post('/mood', data),
  getMy: () => axiosInstance.get('/mood/my'),
  getTrend: () => axiosInstance.get('/mood/my/trend'),
};
