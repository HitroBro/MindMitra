const express = require('express');
const controller = require('../controllers/forum.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verifyJWT);

router.post('/posts', controller.createPost);
router.get('/posts', controller.getPosts);
router.get('/posts/:id', controller.getPostById);
router.patch('/posts/:id', controller.updatePost);
router.delete('/posts/:id', controller.deletePost);
router.post('/posts/:id/like', controller.likePost);
router.post('/posts/:id/report', controller.reportPost);

router.post('/comments', controller.createComment);
router.get('/comments/post/:postId', controller.getCommentsForPost);
router.delete('/comments/:id', controller.deleteComment);

module.exports = router;
