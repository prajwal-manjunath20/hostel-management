const mongoose = require('mongoose');
const { OWNER_STATUS } = require('../config/constants');

const OwnerApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One application per user
        index: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    businessEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    businessAddress: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: [OWNER_STATUS.PENDING, OWNER_STATUS.APPROVED, OWNER_STATUS.REJECTED],
        default: OWNER_STATUS.PENDING,
        index: true
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: 300
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
OwnerApplicationSchema.index({ status: 1, createdAt: -1 });
OwnerApplicationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('OwnerApplication', OwnerApplicationSchema);
