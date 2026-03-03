'use strict';
const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    // Brute-force protection: block after 3 wrong attempts
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 600 } // TTL: auto-delete after 10 min
});

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
