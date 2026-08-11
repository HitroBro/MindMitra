import axiosInstance from './axiosInstance';

export const analyticsApi = {
  overview: () => axiosInstance.get('/admin/analytics/overview'),
  assessmentsTrend: () => axiosInstance.get('/admin/analytics/assessments-trend'),
  appointmentsTrend: () => axiosInstance.get('/admin/analytics/appointments-trend'),
  forumActivity: () => axiosInstance.get('/admin/analytics/forum-activity'),
  resourceUsage: () => axiosInstance.get('/admin/analytics/resource-usage'),
  emergencyAlerts: () => axiosInstance.get('/admin/analytics/emergency-alerts'),
  volunteerActivity: () => axiosInstance.get('/admin/analytics/volunteer-activity'),
};
