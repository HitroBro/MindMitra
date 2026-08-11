import axiosInstance from './axiosInstance';

export const chatApi = {
  sendMessage: (message, sessionId) => axiosInstance.post('/chat/message', { message, sessionId }),
  getHistory: (sessionId) => axiosInstance.get(`/chat/history/${sessionId}`),
  getSessions: () => axiosInstance.get('/chat/sessions'),
};
