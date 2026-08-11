import axiosInstance from './axiosInstance';

export const bookmarkApi = {
  create: (data) => axiosInstance.post('/bookmarks', data),
  getMy: (resourceType) => axiosInstance.get('/bookmarks/my', { params: { resourceType } }),
  delete: (id) => axiosInstance.delete(`/bookmarks/${id}`),
};
