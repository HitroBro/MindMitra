const express = require('express');
const controller = require('../controllers/report.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT);

router.post('/', controller.createReport);
router.get('/my', controller.getMyReports);
router.get('/', authorizeRoles(ROLES.ADMIN), controller.getAllReports);
router.patch('/:id', authorizeRoles(ROLES.ADMIN), controller.updateReport);

module.exports = router;
