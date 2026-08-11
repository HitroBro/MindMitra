const express = require('express');
const controller = require('../controllers/emergency.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT);

router.post('/trigger', controller.triggerManualAlert);
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.COUNSELOR), controller.getAlerts);
router.patch('/:id/resolve', authorizeRoles(ROLES.ADMIN, ROLES.COUNSELOR), controller.resolveAlert);

module.exports = router;
