const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['complaint', 'feedback', 'suggestion', 'mental_health'],
      required: true,
    },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },
    status: { type: String, enum: ['open', 'in_review', 'resolved'], default: 'open' },
    adminResponse: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
