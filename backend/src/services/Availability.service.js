const Appointment = require('../models/Appointment.model');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const getAvailableSlots = async (counselor, dateStr) => {
  const profile = counselor.counselorProfile || {};
  const date = new Date(dateStr);
  const dayAbbr = DAY_ABBR[date.getDay()];

  const workingDays = Array.isArray(profile.workingDays) && profile.workingDays.length > 0
    ? profile.workingDays
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (!workingDays.includes(dayAbbr)) {
    return { slots: [], reason: 'not_working_day' };
  }

  const startMin = toMinutes(profile.workingHours?.start || '09:00');
  const endMin = toMinutes(profile.workingHours?.end || '17:00');
  const duration = profile.slotDurationMinutes || 30;

  const allSlots = [];
  for (let t = startMin; t + duration <= endMin; t += duration) {
    allSlots.push(`${toHHMM(t)}-${toHHMM(t + duration)}`);
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    counselor: counselor._id,
    preferredDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
  }).select('timeSlot');

  const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));

  const slots = allSlots.map((slot) => ({ slot, available: !bookedSlots.has(slot) }));
  return { slots, reason: null };
};

module.exports = { getAvailableSlots };