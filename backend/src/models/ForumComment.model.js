const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true, index: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumComment', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: true },
    content: { type: String, required: true, maxlength: 2000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ForumComment', forumCommentSchema);
