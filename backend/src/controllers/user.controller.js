const { StatusCodes } = require('http-status-codes');
const Appointment = require('../models/Appointment.model');
const User = require('../models/User.model');
const AdminLog = require('../models/AdminLog.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('./auth.controller');
const { getAvailableSlots } = require('../services/availability.service');

// --- Admin: manage all users ---
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(filter);

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { users, total, page: Number(page) }, 'Users fetched'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, user, 'User fetched'));
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'volunteer', 'counselor', 'admin'].includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid role');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  await AdminLog.create({ admin: req.user._id, action: 'update_role', targetType: 'User', targetId: user._id, metadata: { role } });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, user, 'Role updated'));
});

const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  user.isBanned = !user.isBanned;
  await user.save({ validateBeforeSave: false });

  await AdminLog.create({ admin: req.user._id, action: user.isBanned ? 'ban_user' : 'unban_user', targetType: 'User', targetId: user._id });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, user, `User ${user.isBanned ? 'banned' : 'unbanned'}`));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  await AdminLog.create({ admin: req.user._id, action: 'delete_user', targetType: 'User', targetId: user._id });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'User deleted'));
});

// --- Any authenticated user: public directory of counselors (for booking) ---
const getCounselorDirectory = asyncHandler(async (req, res) => {
  const counselors = await User.find({ role: 'counselor', isActive: true, isBanned: false })
    .select('name email college counselorProfile').lean();

  // attach rating summary (avg, count) per counselor
  const counselorIds = counselors.map((c) => c._id);
  const ratings = await Appointment.aggregate([
    { $match: { counselor: { $in: counselorIds }, rating: { $exists: true } } },
    { $group: { _id: '$counselor', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
  ]);
  const ratingMap = {};
  ratings.forEach((r) => { ratingMap[String(r._id)] = r; });
  const enriched = counselors.map((c) => ({
    ...c,
    counselorProfile: {
      ...(c.counselorProfile || {}),
      averageRating: ratingMap[String(c._id)] ? Number(ratingMap[String(c._id)].avgRating.toFixed(2)) : 0,
      ratingCount: ratingMap[String(c._id)] ? ratingMap[String(c._id)].ratingCount : 0,
    },
  }));

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, enriched, 'Counselors fetched'));
});

// --- Any authenticated user: single counselor's full public profile ---
const getCounselorProfile = asyncHandler(async (req, res) => {
  const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' })
    .select('name email college counselorProfile').lean();
  if (!counselor) throw new ApiError(StatusCodes.NOT_FOUND, 'Counselor not found');

  const stats = await Appointment.aggregate([
    { $match: { counselor: counselor._id, rating: { $exists: true } } },
    { $group: { _id: '$counselor', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
  ]);
  const stat = stats[0] || null;
  counselor.counselorProfile = {
    ...(counselor.counselorProfile || {}),
    averageRating: stat ? Number(stat.avgRating.toFixed(2)) : 0,
    ratingCount: stat ? stat.ratingCount : 0,
  };

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, counselor, 'Counselor profile fetched'));
});

// --- Any authenticated user: available booking slots for a counselor on a date ---
const getCounselorAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new ApiError(StatusCodes.BAD_REQUEST, 'A date query param is required (YYYY-MM-DD)');

  const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' });
  if (!counselor) throw new ApiError(StatusCodes.NOT_FOUND, 'Counselor not found');

  const result = await getAvailableSlots(counselor, date);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, result, 'Availability fetched'));
});

// --- Counselor: update own profile ---
const updateMyCounselorProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'photoUrl', 'qualification', 'specialization', 'yearsOfExperience', 'languages', 'bio',
    'consultationModes', 'workingDays', 'workingHours', 'slotDurationMinutes',
    'consultationFee', 'phone', 'officeLocation', 'meetingLink',
  ];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[`counselorProfile.${f}`] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, sanitizeUser(user), 'Profile updated'));
});

// --- Counselor: view assigned students, sorted by risk (high first) ---
const RISK_WEIGHT = { high: 0, medium: 1, low: 2 };
const getMyAssignedStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ assignedCounselor: req.user._id })
    .select('name email riskLevel riskUpdatedAt lastLogin')
    .lean();
  students.sort((a, b) => RISK_WEIGHT[a.riskLevel] - RISK_WEIGHT[b.riskLevel]);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, students, 'Assigned students fetched'));
});

// --- Self profile ---
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, college, avatarUrl } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(college !== undefined && { college }), ...(avatarUrl && { avatarUrl }) },
    { new: true }
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, sanitizeUser(user), 'Profile updated'));
});

module.exports = {
  getAllUsers, getUserById, updateUserRole, toggleBanUser, deleteUser, updateMyProfile, getMyAssignedStudents,
  getCounselorDirectory, getCounselorProfile, getCounselorAvailability, updateMyCounselorProfile,
};