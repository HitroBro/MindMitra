import axiosInstance from './axiosInstance';

export const userApi = {
  getAll: (params) => axiosInstance.get('/users', { params }),
  getById: (id) => axiosInstance.get(`/users/${id}`),
  updateRole: (id, role) => axiosInstance.patch(`/users/${id}/role`, { role }),
  toggleBan: (id) => axiosInstance.patch(`/users/${id}/ban`),
  delete: (id) => axiosInstance.delete(`/users/${id}`),
  updateMyProfile: (data) => axiosInstance.patch('/users/me/profile', data),
  getMyAssignedStudents: () => axiosInstance.get('/users/me/assigned-students'),
  updateMyCounselorProfile: (data) => axiosInstance.patch('/users/me/counselor-profile', data),
  getCounselors: () => axiosInstance.get('/users/counselors'),
  getCounselorAvailability: (id, date) => axiosInstance.get(`/users/counselors/${id}/availability`, { params: { date } }),
};