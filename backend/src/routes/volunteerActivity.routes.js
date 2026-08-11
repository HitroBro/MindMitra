const express = require('express');
const controller = require('../controllers/volunteerActivity.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT, authorizeRoles(ROLES.VOLUNTEER, ROLES.ADMIN));

router.get('/reported-posts', controller.getReportedPosts);
router.get('/recent-posts', controller.getRecentPosts);
router.post('/', controller.logActivity);
router.get('/my', controller.getMyActivity);

module.exports = router;