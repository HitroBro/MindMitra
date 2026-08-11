const mongoose = require('mongoose');

const volunteerActivitySchema = new mongoose.Schema(
  {
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['post_reviewed', 'post_removed', 'comment_removed', 'alert_flagged'],
      required: true,
    },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerActivity', volunteerActivitySchema);
