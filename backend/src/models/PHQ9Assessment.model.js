const mongoose = require('mongoose');
const { PHQ9_SEVERITY } = require('../utils/constants');

const phq9Schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => arr.length === 9 && arr.every((v) => v >= 0 && v <= 3),
        message: 'PHQ-9 requires exactly 9 answers, each between 0 and 3',
      },
    },
    totalScore: { type: Number, required: true, min: 0, max: 27 },
    severity: { type: String, enum: Object.values(PHQ9_SEVERITY), required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

phq9Schema.index({ user: 1, takenAt: -1 });

module.exports = mongoose.model('PHQ9Assessment', phq9Schema);
