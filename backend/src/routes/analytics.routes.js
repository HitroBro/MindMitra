const express = require('express');
const controller = require('../controllers/analytics.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT, authorizeRoles(ROLES.ADMIN));

router.get('/overview', controller.getOverview);
router.get('/assessments-trend', controller.getAssessmentsTrend);
router.get('/appointments-trend', controller.getAppointmentsTrend);
router.get('/forum-activity', controller.getForumActivity);
router.get('/resource-usage', controller.getResourceUsage);
router.get('/emergency-alerts', controller.getEmergencyAlertsStats);
router.get('/volunteer-activity', controller.getVolunteerActivityStats);

module.exports = router;
