const { StatusCodes } = require('http-status-codes');
const Journal = require('../models/Journal.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createJournal = asyncHandler(async (req, res) => {
  const { title, content, isPrivate = true } = req.body;
  const journal = await Journal.create({ user: req.user._id, title, content, isPrivate });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, journal, 'Journal entry saved'));
});

const getMyJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, journals, 'Journals fetched'));
});

const getJournalById = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({ _id: req.params.id, user: req.user._id });
  if (!journal) throw new ApiError(StatusCodes.NOT_FOUND, 'Journal entry not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, journal, 'Journal fetched'));
});

const updateJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: req.body },
    { new: true }
  );
  if (!journal) throw new ApiError(StatusCodes.NOT_FOUND, 'Journal entry not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, journal, 'Journal updated'));
});

const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!journal) throw new ApiError(StatusCodes.NOT_FOUND, 'Journal entry not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Journal deleted'));
});

module.exports = { createJournal, getMyJournals, getJournalById, updateJournal, deleteJournal };
