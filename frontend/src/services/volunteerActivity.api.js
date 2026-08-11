import axiosInstance from './axiosInstance';

export const volunteerActivityApi = {
  getReportedPosts: () => axiosInstance.get('/volunteer-activities/reported-posts'),
  getRecentPosts: (params) => axiosInstance.get('/volunteer-activities/recent-posts', { params }),
  log: (data) => axiosInstance.post('/volunteer-activities', data),
  getMy: () => axiosInstance.get('/volunteer-activities/my'),
};
