const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'OWNER_APPROVED',
            'OWNER_REJECTED',
            'OWNER_SUSPENDED',
            'OWNER_ACTIVATED',
            'STAFF_CREATED',
            'STAFF_DELETED',
            'HOSTEL_CREATED',
            'HOSTEL_DELETED',
            'BOOKING_APPROVED',
            'BOOKING_REJECTED'
        ]
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    targetResource: {
        type: String // e.g., "OwnerApplication:123", "Hostel:456"
    },
    details: {
        type: mongoose.Schema.Types.Mixed // Additional context
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
