const express = require('express');
const controller = require('../controllers/appointment.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT);

router.post('/', authorizeRoles(ROLES.STUDENT), controller.createAppointment);
router.get('/my', authorizeRoles(ROLES.STUDENT), controller.getMyAppointments);
router.patch('/:id/reschedule', authorizeRoles(ROLES.STUDENT), controller.rescheduleMyAppointment);
router.delete('/:id', authorizeRoles(ROLES.STUDENT), controller.cancelMyAppointment);

router.get('/counselor', authorizeRoles(ROLES.COUNSELOR), controller.getCounselorAppointments);
router.patch('/:id/status', authorizeRoles(ROLES.COUNSELOR), controller.updateAppointmentStatus);
router.post('/:id/start', authorizeRoles(ROLES.COUNSELOR), controller.startSession);
router.get('/session/:sessionId', controller.getBySession);
router.patch('/:id/complete', controller.completeSession);
router.post('/:id/rate', authorizeRoles(ROLES.STUDENT), controller.submitRating);

router.get('/', authorizeRoles(ROLES.ADMIN), controller.getAllAppointments);

module.exports = router;