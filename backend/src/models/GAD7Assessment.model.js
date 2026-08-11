const mongoose = require('mongoose');
const { GAD7_SEVERITY } = require('../utils/constants');

const gad7Schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => arr.length === 7 && arr.every((v) => v >= 0 && v <= 3),
        message: 'GAD-7 requires exactly 7 answers, each between 0 and 3',
      },
    },
    totalScore: { type: Number, required: true, min: 0, max: 21 },
    severity: { type: String, enum: Object.values(GAD7_SEVERITY), required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gad7Schema.index({ user: 1, takenAt: -1 });

module.exports = mongoose.model('GAD7Assessment', gad7Schema);
