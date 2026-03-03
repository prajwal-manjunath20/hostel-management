const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  gatePassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GatePass',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'created',
      'coordinator_approved',
      'coordinator_rejected',
      'warden_approved',
      'warden_rejected',
      'exit_scanned',
      'return_scanned'
    ],
    required: true
  },
  comment: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String
});

// Index for performance
activityLogSchema.index({ gatePassId: 1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
