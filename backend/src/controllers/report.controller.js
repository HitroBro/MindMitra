const { StatusCodes } = require('http-status-codes');
const Report = require('../models/Report.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createReport = asyncHandler(async (req, res) => {
  const { type, subject, description } = req.body;
  const report = await Report.create({ submittedBy: req.user._id, type, subject, description });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, report, 'Report submitted'));
});

const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, reports, 'Reports fetched'));
});

const getAllReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const reports = await Report.find(filter).populate('submittedBy', 'name email role').sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, reports, 'All reports fetched'));
});

const updateReport = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;
  const report = await Report.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });
  if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, report, 'Report updated'));
});

module.exports = { createReport, getMyReports, getAllReports, updateReport };
