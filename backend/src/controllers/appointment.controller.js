const { StatusCodes } = require('http-status-codes');
const Appointment = require('../models/Appointment.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { APPOINTMENT_STATUS } = require('../utils/constants');
const { emitToUser } = require('../socket');
const crypto = require('crypto');

const createAppointment = asyncHandler(async (req, res) => {
  const { counselor, preferredDate, timeSlot, consultationMode, reason } = req.body;
  if (!['online', 'offline', 'phone'].includes(consultationMode)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A valid consultation mode is required');
  }

  // If counselor requires payment (consultationFee > 0) ensure client indicates 'paid' flag
  const counselorUser = await User.findById(counselor).select('counselorProfile');
  if (!counselorUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Counselor not found');
  const fee = counselorUser.counselorProfile?.consultationFee || 0;
  if (fee > 0 && !req.body.paid) {
    // student must pay before booking
    throw new ApiError(StatusCodes.PAYMENT_REQUIRED, 'This counselor requires payment to book an appointment');
  }

  // Server-side double-booking guard — the frontend only shows free slots,
  // but a race (two tabs, slow network) could still submit a taken one.
  const dayStart = new Date(preferredDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(preferredDate);
  dayEnd.setHours(23, 59, 59, 999);

  const clash = await Appointment.findOne({
    counselor,
    timeSlot,
    preferredDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
  });
  if (clash) {
    throw new ApiError(StatusCodes.CONFLICT, 'That slot was just booked by someone else — please pick another.');
  }

  const appointment = await Appointment.create({ student: req.user._id, counselor, preferredDate, timeSlot, consultationMode, reason });

  await Notification.create({
    user: counselor,
    title: 'New appointment request',
    message: `${req.user.name} requested an appointment on ${new Date(preferredDate).toLocaleDateString()}`,
    type: 'appointment',
  });

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, appointment, 'Appointment requested'));
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ student: req.user._id }).populate('counselor', 'name email').sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointments, 'Appointments fetched'));
});

const getCounselorAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ counselor: req.user._id }).populate('student', 'name email').sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointments, 'Appointments fetched'));
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, counselorNote, cancelReason } = req.body;
  if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  if (String(appointment.counselor) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only update your own appointments');
  }

  appointment.status = status;
  if (counselorNote) appointment.counselorNote = counselorNote;
  if (cancelReason) appointment.cancelReason = cancelReason;
  await appointment.save();

  // First approved appointment establishes ongoing care continuity —
  // this counselor becomes the default escalation target for this student.
  if (status === APPOINTMENT_STATUS.APPROVED) {
    await User.findOneAndUpdate(
      { _id: appointment.student, assignedCounselor: null },
      { assignedCounselor: appointment.counselor }
    );
  }

  await Notification.create({
    user: appointment.student,
    title: 'Appointment update',
    message: `Your appointment status changed to ${status}`,
    type: 'appointment',
  });

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Appointment updated'));
});

const startSession = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  if (String(appointment.counselor) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only start your own appointments');
  }
  if (appointment.status !== APPOINTMENT_STATUS.APPROVED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only approved appointments can be started');
  }

  const sessionId = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  appointment.sessionId = sessionId;
  appointment.status = APPOINTMENT_STATUS.IN_SESSION;
  await appointment.save();

  const notification = await Notification.create({
    user: appointment.student,
    title: 'Session started',
    message: `Your session with ${req.user.name} is starting now.`,
    type: 'appointment',
    link: `/session/${sessionId}`,
  });

  try {
    emitToUser(appointment.student, 'notification:new', notification);
  } catch (err) {
    // non-fatal — continue even if real-time push fails
  }

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { sessionId, appointment }, 'Session started'));
});

const getBySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const appointment = await Appointment.findOne({ sessionId }).populate('student', 'name email').populate('counselor', 'name email');
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  // ensure only participants or admin can fetch
  const userId = String(req.user._id);
  if (String(appointment.student._id) !== userId && String(appointment.counselor._id) !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not a participant of this session');
  }
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Session appointment fetched'));
});

const completeSession = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  const userId = String(req.user._id);
  // allow either participant (student or counselor) to end the session
  if (String(appointment.student) !== userId && String(appointment.counselor) !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this appointment');
  }

  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  await appointment.save();

  // notify the other participant
  const otherUser = String(appointment.student) === userId ? appointment.counselor : appointment.student;
  await Notification.create({
    user: otherUser,
    title: 'Session ended',
    message: `The session has been ended by the other participant.`,
    type: 'appointment',
  });

  try { emitToUser(otherUser, 'notification:new', { title: 'Session ended', message: 'The session has been ended.' }); } catch (err) {}

  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Appointment completed'));
});

const submitRating = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  if (String(appointment.student) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the student can submit a rating');
  }
  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Can only rate completed appointments');
  }
  appointment.rating = Number(rating);
  appointment.studentFeedback = feedback || '';
  await appointment.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Rating submitted'));
});

const cancelMyAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  if (String(appointment.student) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only cancel your own appointments');
  }
  if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only pending appointments can be cancelled');
  }
  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  await appointment.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Appointment cancelled'));
});

const rescheduleMyAppointment = asyncHandler(async (req, res) => {
  const { preferredDate, timeSlot } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  if (String(appointment.student) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only reschedule your own appointments');
  }
  if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only pending appointments can be rescheduled');
  }

  const dayStart = new Date(preferredDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(preferredDate);
  dayEnd.setHours(23, 59, 59, 999);

  const clash = await Appointment.findOne({
    _id: { $ne: appointment._id },
    counselor: appointment.counselor,
    timeSlot,
    preferredDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
  });
  if (clash) throw new ApiError(StatusCodes.CONFLICT, 'That slot is already taken — please pick another.');

  appointment.preferredDate = preferredDate;
  appointment.timeSlot = timeSlot;
  await appointment.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointment, 'Appointment rescheduled'));
});

const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate('student', 'name email')
    .populate('counselor', 'name email')
    .sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, appointments, 'All appointments fetched'));
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getCounselorAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
  rescheduleMyAppointment,
  getAllAppointments,
  startSession,
  getBySession,
  completeSession,
  submitRating,
};