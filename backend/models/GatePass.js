'use strict';

const mongoose = require('mongoose');

/**
 * GatePass — tracks resident leave requests through a two-stage approval flow:
 *   1. Coordinator (Staff) approval
 *   2. Warden (Owner) approval
 */
const gatePassSchema = new mongoose.Schema({
    gatePassId: {
        type: String,
        required: true,
        unique: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    destination: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    outDateTime: {
        type: Date,
        required: true
    },
    expectedReturnDateTime: {
        type: Date,
        required: true
    },
    actualReturnDateTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending_coordinator', 'pending_warden', 'approved', 'rejected'],
        default: 'pending_coordinator'
    },
    coordinatorApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, default: '' },
        decidedAt: Date
    },
    wardenApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, default: '' },
        decidedAt: Date
    }
}, {
    timestamps: true
});

// Indexes for common query patterns
gatePassSchema.index({ studentId: 1, createdAt: -1 });
gatePassSchema.index({ status: 1 });

module.exports = mongoose.model('GatePass', gatePassSchema);
