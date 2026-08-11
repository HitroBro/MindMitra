const mongoose = require('mongoose');

const moodTrackingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moodScore: { type: Number, required: true, min: 1, max: 5 },
    moodLabel: {
      type: String,
      enum: ['very_sad', 'sad', 'neutral', 'happy', 'very_happy'],
      required: true,
    },
    note: { type: String, default: '', maxlength: 500 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

moodTrackingSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MoodTracking', moodTrackingSchema);
