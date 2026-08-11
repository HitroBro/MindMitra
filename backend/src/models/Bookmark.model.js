const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceType: { type: String, enum: ['post', 'resource'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, resourceType: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
