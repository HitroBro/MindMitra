const express = require('express');
const controller = require('../controllers/feedback.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.post('/', verifyJWT, controller.createFeedback);
router.get('/', verifyJWT, authorizeRoles(ROLES.ADMIN), controller.getAllFeedback);

module.exports = router;
