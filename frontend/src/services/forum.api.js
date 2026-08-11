import axiosInstance from './axiosInstance';

export const forumApi = {
  createPost: (data) => axiosInstance.post('/forum/posts', data),
  getPosts: (params) => axiosInstance.get('/forum/posts', { params }),
  getPost: (id) => axiosInstance.get(`/forum/posts/${id}`),
  updatePost: (id, data) => axiosInstance.patch(`/forum/posts/${id}`, data),
  deletePost: (id) => axiosInstance.delete(`/forum/posts/${id}`),
  likePost: (id) => axiosInstance.post(`/forum/posts/${id}/like`),
  reportPost: (id) => axiosInstance.post(`/forum/posts/${id}/report`),
  createComment: (data) => axiosInstance.post('/forum/comments', data),
  getComments: (postId) => axiosInstance.get(`/forum/comments/post/${postId}`),
  deleteComment: (id) => axiosInstance.delete(`/forum/comments/${id}`),
};
