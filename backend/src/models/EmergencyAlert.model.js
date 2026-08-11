const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggerSource: { type: String, enum: ['chatbot', 'assessment', 'manual'], required: true },
    triggerContext: { type: String, default: '' },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
