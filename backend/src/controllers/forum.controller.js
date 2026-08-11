const { StatusCodes } = require('http-status-codes');
const ForumPost = require('../models/ForumPost.model');
const ForumComment = require('../models/ForumComment.model');
const VolunteerActivity = require('../models/VolunteerActivity.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../utils/constants');
const { broadcastEvent } = require('../socket');

const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags = [], category = 'general', isAnonymous = true } = req.body;
  const post = await ForumPost.create({ author: req.user._id, title, content, tags, category, isAnonymous });
  const sanitized = post.toPublicJSON(req.user._id);
  broadcastEvent('forum:newPost', sanitized);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, sanitized, 'Post created'));
});

const getPosts = asyncHandler(async (req, res) => {
  const { search, tag, category, sort = 'recent', page = 1, limit = 10 } = req.query;
  const filter = { status: 'active' };
  if (tag) filter.tags = tag;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const sortMap = { recent: { createdAt: -1 }, trending: { likesCount: -1, createdAt: -1 }, most_commented: { commentCount: -1 } };

  let query = ForumPost.find(filter);
  if (sort === 'trending') {
    // likes is an array, so sort on its size via aggregation-lite approach: fetch then sort in memory for small pages
    const all = await query.sort({ createdAt: -1 }).limit(200);
    all.sort((a, b) => b.likes.length - a.likes.length);
    const paged = all.slice((page - 1) * limit, page * limit);
    const sanitized = paged.map((p) => p.toPublicJSON(req.user._id));
    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { posts: sanitized, total: all.length }, 'Posts fetched'));
  }

  const [posts, total] = await Promise.all([
    query.sort(sortMap[sort] || sortMap.recent).skip((page - 1) * limit).limit(Number(limit)),
    ForumPost.countDocuments(filter),
  ]);

  const sanitized = posts.map((p) => p.toPublicJSON(req.user._id));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { posts: sanitized, total }, 'Posts fetched'));
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, post.toPublicJSON(req.user._id), 'Post fetched'));
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  if (String(post.author) !== String(req.user._id)) throw new ApiError(StatusCodes.FORBIDDEN, 'Not your post');
  const { title, content, tags } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  if (tags) post.tags = tags;
  await post.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, post.toPublicJSON(req.user._id), 'Post updated'));
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  const isOwner = String(post.author) === String(req.user._id);
  const canModerate = [ROLES.VOLUNTEER, ROLES.ADMIN].includes(req.user.role);
  if (!isOwner && !canModerate) throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this post');

  await post.deleteOne();
  if (!isOwner) {
    await VolunteerActivity.create({
      volunteer: req.user._id,
      action: 'post_removed',
      targetType: 'ForumPost',
      targetId: post._id,
    });
  }
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Post deleted'));
});

const likePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  const idx = post.likes.findIndex((u) => String(u) === String(req.user._id));
  if (idx === -1) post.likes.push(req.user._id);
  else post.likes.splice(idx, 1);
  await post.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { likesCount: post.likes.length }, 'Post like toggled'));
});

const reportPost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  post.isReported = true;
  post.reportCount += 1;
  post.status = post.reportCount >= 3 ? 'under_review' : post.status;
  await post.save();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Post reported'));
});

// --- Comments ---
const createComment = asyncHandler(async (req, res) => {
  const { post, content, parentComment = null, isAnonymous = true } = req.body;
  const parentPost = await ForumPost.findById(post);
  if (!parentPost) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');

  const comment = await ForumComment.create({ post, content, parentComment, isAnonymous, author: req.user._id });
  parentPost.commentCount += 1;
  await parentPost.save();

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, comment, 'Comment added'));
});

const getCommentsForPost = asyncHandler(async (req, res) => {
  const comments = await ForumComment.find({ post: req.params.postId }).sort({ createdAt: 1 });
  const sanitized = comments.map((c) => {
    const obj = c.toObject();
    if (obj.isAnonymous && String(obj.author) !== String(req.user._id)) obj.author = null;
    return obj;
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, sanitized, 'Comments fetched'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await ForumComment.findById(req.params.id);
  if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');
  const isOwner = String(comment.author) === String(req.user._id);
  const canModerate = [ROLES.VOLUNTEER, ROLES.ADMIN].includes(req.user.role);
  if (!isOwner && !canModerate) throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized');

  await comment.deleteOne();
  await ForumPost.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
  if (!isOwner) {
    await VolunteerActivity.create({ volunteer: req.user._id, action: 'comment_removed', targetType: 'ForumComment', targetId: comment._id });
  }
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Comment deleted'));
});

module.exports = {
  createPost, getPosts, getPostById, updatePost, deletePost, likePost, reportPost,
  createComment, getCommentsForPost, deleteComment,
};