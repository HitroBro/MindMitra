const { StatusCodes } = require('http-status-codes');
const PHQ9Assessment = require('../models/PHQ9Assessment.model');
const GAD7Assessment = require('../models/GAD7Assessment.model');
const EmergencyAlert = require('../models/EmergencyAlert.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { PHQ9_SEVERITY, GAD7_SEVERITY } = require('../utils/constants');

const scorePHQ9 = (total) => {
  if (total <= 4) return PHQ9_SEVERITY.MINIMAL;
  if (total <= 9) return PHQ9_SEVERITY.MILD;
  if (total <= 14) return PHQ9_SEVERITY.MODERATE;
  if (total <= 19) return PHQ9_SEVERITY.MODERATELY_SEVERE;
  return PHQ9_SEVERITY.SEVERE;
};

const scoreGAD7 = (total) => {
  if (total <= 4) return GAD7_SEVERITY.MINIMAL;
  if (total <= 9) return GAD7_SEVERITY.MILD;
  if (total <= 14) return GAD7_SEVERITY.MODERATE;
  return GAD7_SEVERITY.SEVERE;
};

const submitPHQ9 = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== 9) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'PHQ-9 requires exactly 9 answers');
  }
  const totalScore = answers.reduce((a, b) => a + b, 0);
  const severity = scorePHQ9(totalScore);
  const assessment = await PHQ9Assessment.create({ user: req.user._id, answers, totalScore, severity });

  // Question 9 of PHQ-9 specifically screens for self-harm ideation
  if (answers[8] > 0 || severity === PHQ9_SEVERITY.SEVERE) {
    await EmergencyAlert.create({
      user: req.user._id,
      triggerSource: 'assessment',
      triggerContext: `PHQ-9 score ${totalScore} (${severity}), item-9 response ${answers[8]}`,
    });
  }

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, assessment, 'PHQ-9 submitted'));
});

const submitGAD7 = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== 7) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'GAD-7 requires exactly 7 answers');
  }
  const totalScore = answers.reduce((a, b) => a + b, 0);
  const severity = scoreGAD7(totalScore);
  const assessment = await GAD7Assessment.create({ user: req.user._id, answers, totalScore, severity });

  if (severity === GAD7_SEVERITY.SEVERE) {
    await EmergencyAlert.create({
      user: req.user._id,
      triggerSource: 'assessment',
      triggerContext: `GAD-7 score ${totalScore} (severe)`,
    });
  }

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, assessment, 'GAD-7 submitted'));
});

const getMyPHQ9History = asyncHandler(async (req, res) => {
  const history = await PHQ9Assessment.find({ user: req.user._id }).sort({ takenAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, history, 'PHQ-9 history fetched'));
});

const getMyGAD7History = asyncHandler(async (req, res) => {
  const history = await GAD7Assessment.find({ user: req.user._id }).sort({ takenAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, history, 'GAD-7 history fetched'));
});

module.exports = { submitPHQ9, submitGAD7, getMyPHQ9History, getMyGAD7History };
