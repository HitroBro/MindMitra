const cron = require('node-cron');
const Appointment = require('../models/Appointment.model');
const Notification = require('../models/Notification.model');
const { APPOINTMENT_STATUS } = require('../utils/constants');
const { emitToUser } = require('../socket');
const logger = require('../utils/logger');

// Runs every minute — safe default for small deployments. Marks appointments
// whose end time is in the past as completed and notifies participants.
const start = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find appointments in approved or in_session where preferredDate + endTime < now
      const candidates = await Appointment.find({ status: { $in: [APPOINTMENT_STATUS.APPROVED, APPOINTMENT_STATUS.IN_SESSION] } });
      for (const appt of candidates) {
        // timeSlot format: HH:MM-HH:MM
        const [startStr, endStr] = appt.timeSlot.split('-');
        const date = new Date(appt.preferredDate);
        const [eh, em] = endStr.split(':').map(Number);
        date.setHours(eh, em, 0, 0);
        if (date <= now) {
          appt.status = APPOINTMENT_STATUS.COMPLETED;
          await appt.save();
          await Notification.create({ user: appt.student, title: 'Appointment completed', message: 'Your appointment has been marked completed.', type: 'appointment' });
          await Notification.create({ user: appt.counselor, title: 'Appointment completed', message: 'Appointment has been marked completed.', type: 'appointment' });
          try { emitToUser(appt.student, 'notification:new', { title: 'Appointment completed', message: 'Your appointment has been marked completed.' }); } catch (e) {}
          try { emitToUser(appt.counselor, 'notification:new', { title: 'Appointment completed', message: 'Appointment has been marked completed.' }); } catch (e) {}
        }
      }
    } catch (err) {
      logger.error('Auto-complete job failed', err);
    }
  });
};

module.exports = { start };
