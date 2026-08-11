const { StatusCodes } = require('http-status-codes');
const MoodTracking = require('../models/MoodTracking.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const logMood = asyncHandler(async (req, res) => {
  const { moodScore, moodLabel, note, date } = req.body;
  const mood = await MoodTracking.create({ user: req.user._id, moodScore, moodLabel, note, date: date || Date.now() });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, mood, 'Mood logged'));
});

const getMyMoods = asyncHandler(async (req, res) => {
  const moods = await MoodTracking.find({ user: req.user._id }).sort({ date: -1 }).limit(90);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, moods, 'Mood history fetched'));
});

const getMyMoodTrend = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const moods = await MoodTracking.find({ user: req.user._id, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 });
  const trend = moods.map((m) => ({ date: m.date, moodScore: m.moodScore }));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, trend, '30-day mood trend fetched'));
});

module.exports = { logMood, getMyMoods, getMyMoodTrend };
