const { StatusCodes } = require('http-status-codes');
const Notification = require('../models/Notification.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, notifications, 'Notifications fetched'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, notification, 'Notification marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'All notifications marked as read'));
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
