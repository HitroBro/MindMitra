const express = require('express');
const controller = require('../controllers/assessment.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verifyJWT);

router.post('/phq9', controller.submitPHQ9);
router.get('/phq9/my', controller.getMyPHQ9History);
router.post('/gad7', controller.submitGAD7);
router.get('/gad7/my', controller.getMyGAD7History);

module.exports = router;
