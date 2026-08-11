import axiosInstance from './axiosInstance';

export const counselorNoteApi = {
  create: (data) => axiosInstance.post('/counselor-notes', data),
  getForStudent: (studentId) => axiosInstance.get(`/counselor-notes/student/${studentId}`),
};
