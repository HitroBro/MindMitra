import axiosInstance from './axiosInstance';

export const recommendationApi = {
  getMy: () => axiosInstance.get('/recommendations/my'),
};