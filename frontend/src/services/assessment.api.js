import axiosInstance from './axiosInstance';

export const assessmentApi = {
  submitPHQ9: (answers) => axiosInstance.post('/assessments/phq9', { answers }),
  getMyPHQ9: () => axiosInstance.get('/assessments/phq9/my'),
  submitGAD7: (answers) => axiosInstance.post('/assessments/gad7', { answers }),
  getMyGAD7: () => axiosInstance.get('/assessments/gad7/my'),
};
