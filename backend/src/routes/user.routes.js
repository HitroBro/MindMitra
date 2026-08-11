const express = require('express');
const controller = require('../controllers/user.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(verifyJWT);

router.patch('/me/profile', controller.updateMyProfile);
router.patch('/me/counselor-profile', authorizeRoles(ROLES.COUNSELOR), controller.updateMyCounselorProfile);
router.get('/me/assigned-students', authorizeRoles(ROLES.COUNSELOR), controller.getMyAssignedStudents);
router.get('/counselors', controller.getCounselorDirectory);
router.get('/counselors/:id/availability', controller.getCounselorAvailability);
router.get('/counselors/:id', controller.getCounselorProfile);

router.get('/', authorizeRoles(ROLES.ADMIN), controller.getAllUsers);
router.get('/:id', authorizeRoles(ROLES.ADMIN), controller.getUserById);
router.patch('/:id/role', authorizeRoles(ROLES.ADMIN), controller.updateUserRole);
router.patch('/:id/ban', authorizeRoles(ROLES.ADMIN), controller.toggleBanUser);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), controller.deleteUser);

module.exports = router;