import axiosInstance from './axiosInstance';

export const notificationApi = {
  getMy: () => axiosInstance.get('/notifications/my'),
  markRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosInstance.patch('/notifications/read-all'),
};