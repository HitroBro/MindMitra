const { StatusCodes } = require('http-status-codes');
const User = require('../models/User.model');
const Appointment = require('../models/Appointment.model');
const ForumPost = require('../models/ForumPost.model');
const Resource = require('../models/Resource.model');
const PHQ9Assessment = require('../models/PHQ9Assessment.model');
const GAD7Assessment = require('../models/GAD7Assessment.model');
const EmergencyAlert = require('../models/EmergencyAlert.model');
const VolunteerActivity = require('../models/VolunteerActivity.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../utils/constants');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, students, volunteers, counselors, totalAppointments, totalPosts, totalResources, openAlerts] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.VOLUNTEER }),
      User.countDocuments({ role: ROLES.COUNSELOR }),
      Appointment.countDocuments(),
      ForumPost.countDocuments(),
      Resource.countDocuments(),
      EmergencyAlert.countDocuments({ status: 'open' }),
    ]);

  const dau = await User.countDocuments({ lastLogin: { $gte: daysAgo(1) } });
  const mau = await User.countDocuments({ lastLogin: { $gte: daysAgo(30) } });

  res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, {
      totalUsers, students, volunteers, counselors,
      totalAppointments, totalPosts, totalResources, openAlerts, dau, mau,
    }, 'Overview analytics fetched')
  );
});

const getAssessmentsTrend = asyncHandler(async (req, res) => {
  const since = daysAgo(90);
  const phq9 = await PHQ9Assessment.aggregate([
    { $match: { takenAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$takenAt' } }, avgScore: { $avg: '$totalScore' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const gad7 = await GAD7Assessment.aggregate([
    { $match: { takenAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$takenAt' } }, avgScore: { $avg: '$totalScore' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { phq9, gad7 }, 'Assessment trends fetched'));
});

const getAppointmentsTrend = asyncHandler(async (req, res) => {
  const byStatus = await Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, byStatus, 'Appointment trends fetched'));
});

const getForumActivity = asyncHandler(async (req, res) => {
  const since = daysAgo(30);
  const postsPerDay = await ForumPost.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, postsPerDay, 'Forum activity fetched'));
});

const getResourceUsage = asyncHandler(async (req, res) => {
  const topResources = await Resource.find().sort({ downloadCount: -1 }).limit(10).select('title type downloadCount viewCount');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, topResources, 'Resource usage fetched'));
});

const getEmergencyAlertsStats = asyncHandler(async (req, res) => {
  const byStatus = await EmergencyAlert.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const bySource = await EmergencyAlert.aggregate([{ $group: { _id: '$triggerSource', count: { $sum: 1 } } }]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { byStatus, bySource }, 'Emergency alert stats fetched'));
});

const getVolunteerActivityStats = asyncHandler(async (req, res) => {
  const byAction = await VolunteerActivity.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, byAction, 'Volunteer activity stats fetched'));
});

module.exports = {
  getOverview,
  getAssessmentsTrend,
  getAppointmentsTrend,
  getForumActivity,
  getResourceUsage,
  getEmergencyAlertsStats,
  getVolunteerActivityStats,
};
