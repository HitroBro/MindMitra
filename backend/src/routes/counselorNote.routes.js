const express = require('express');
const controller = require('../controllers/counselorNote.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT, authorizeRoles(ROLES.COUNSELOR));

router.post('/', controller.createNote);
router.get('/student/:studentId', controller.getNotesForStudent);

module.exports = router;
