const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messages: [chatMessageSchema],
    emergencyTriggered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
