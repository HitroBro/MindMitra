const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Journal', journalSchema);
