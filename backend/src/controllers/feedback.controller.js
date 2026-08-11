const { StatusCodes } = require('http-status-codes');
const Feedback = require('../models/Feedback.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createFeedback = asyncHandler(async (req, res) => {
  const { rating, category, message } = req.body;
  const feedback = await Feedback.create({ user: req.user?._id || null, rating, category, message });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, feedback, 'Feedback submitted'));
});

const getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, feedback, 'Feedback fetched'));
});

module.exports = { createFeedback, getAllFeedback };
