const { StatusCodes } = require('http-status-codes');
const VolunteerActivity = require('../models/VolunteerActivity.model');
const ForumPost = require('../models/ForumPost.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getReportedPosts = asyncHandler(async (req, res) => {
  const posts = await ForumPost.find({ isReported: true, status: { $ne: 'removed' } }).sort({ reportCount: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, posts, 'Reported posts fetched'));
});

// All non-removed posts, newest first — gives volunteers/admins visibility
// into everything being posted, not just what's already been reported.
const getRecentPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const filter = { status: { $ne: 'removed' } };
  const [posts, total] = await Promise.all([
    ForumPost.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    ForumPost.countDocuments(filter),
  ]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { posts, total }, 'Recent posts fetched'));
});

const logActivity = asyncHandler(async (req, res) => {
  const { action, targetType, targetId, note } = req.body;
  const activity = await VolunteerActivity.create({ volunteer: req.user._id, action, targetType, targetId, note });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, activity, 'Activity logged'));
});

const getMyActivity = asyncHandler(async (req, res) => {
  const activities = await VolunteerActivity.find({ volunteer: req.user._id }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, activities, 'Activity fetched'));
});

module.exports = { getReportedPosts, getRecentPosts, logActivity, getMyActivity };