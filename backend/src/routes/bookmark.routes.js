const express = require('express');
const controller = require('../controllers/bookmark.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verifyJWT);

router.post('/', controller.createBookmark);
router.get('/my', controller.getMyBookmarks);
router.delete('/:id', controller.deleteBookmark);

module.exports = router;
