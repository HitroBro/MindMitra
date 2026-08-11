const { StatusCodes } = require('http-status-codes');
const EmergencyAlert = require('../models/EmergencyAlert.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const triggerManualAlert = asyncHandler(async (req, res) => {
  const { context } = req.body;
  const alert = await EmergencyAlert.create({ user: req.user._id, triggerSource: 'manual', triggerContext: context || '' });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, alert, 'Emergency alert raised'));
});

const getAlerts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const alerts = await EmergencyAlert.find(filter).populate('user', 'name email').populate('handledBy', 'name').sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, alerts, 'Emergency alerts fetched'));
});

const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findByIdAndUpdate(
    req.params.id,
    { status: 'resolved', handledBy: req.user._id, resolvedAt: new Date() },
    { new: true }
  );
  if (!alert) throw new ApiError(StatusCodes.NOT_FOUND, 'Alert not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, alert, 'Alert resolved'));
});

module.exports = { triggerManualAlert, getAlerts, resolveAlert };
