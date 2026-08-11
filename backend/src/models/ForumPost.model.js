const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: true },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['general', 'stress', 'sleep', 'anxiety', 'depression', 'exams', 'relationships', 'self_help'],
      default: 'general',
    },
    tags: [{ type: String, trim: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'under_review', 'removed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Never leak author identity for anonymous posts in API responses
forumPostSchema.methods.toPublicJSON = function toPublicJSON(requestingUserId) {
  const obj = this.toObject();
  if (obj.isAnonymous && String(obj.author) !== String(requestingUserId)) {
    obj.author = null;
  }
  return obj;
};

module.exports = mongoose.model('ForumPost', forumPostSchema);