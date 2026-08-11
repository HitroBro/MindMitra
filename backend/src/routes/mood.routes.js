const express = require('express');
const controller = require('../controllers/mood.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verifyJWT);

router.post('/', controller.logMood);
router.get('/my', controller.getMyMoods);
router.get('/my/trend', controller.getMyMoodTrend);

module.exports = router;
