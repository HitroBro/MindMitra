const express = require('express');
const controller = require('../controllers/resource.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(verifyJWT);

router.post('/', authorizeRoles(ROLES.ADMIN), upload.single('file'), controller.uploadResource);
router.get('/', controller.getResources);
router.get('/:id', controller.getResourceById);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), controller.deleteResource);
router.post('/:id/download', controller.trackDownload);

module.exports = router;
