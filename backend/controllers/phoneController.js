const OtpVerification = require('../models/OtpVerification');
const User = require('../models/User');
const { generateOtp, sendOtp, verifyOtp } = require('../services/smsService');
const { success, error, serverError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc  Send OTP to phone number
 * @route POST /api/auth/send-otp
 * @access Private
 */
exports.sendPhoneOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return error(res, 'VALIDATION_ERROR', 'Phone number is required');

        // Basic E.164 validation
        const phoneRegex = /^\+[1-9]\d{7,14}$/;
        if (!phoneRegex.test(phone)) {
            return error(res, 'VALIDATION_ERROR', 'Phone must be in E.164 format, e.g. +919876543210');
        }

        const { otp, hash, expiresAt } = generateOtp();

        // Upsert OTP record — reset attempts on new send
        await OtpVerification.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, phone, otpHash: hash, expiresAt, verified: false, attempts: 0 },
            { upsert: true, new: true }
        );

        const result = await sendOtp(phone, otp);
        if (!result.success) {
            return error(res, 'SMS_FAILED', 'Failed to send OTP. Check your phone number.', 500);
        }

        return success(res, null, result.dev
            ? 'OTP logged to server console (dev mode — Twilio not configured)'
            : 'OTP sent to your phone number');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Verify OTP and mark phone as verified
 * @route POST /api/auth/verify-otp
 * @access Private
 */
exports.verifyPhoneOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) return error(res, 'VALIDATION_ERROR', 'OTP is required');

        const record = await OtpVerification.findOne({
            userId: req.user.id,
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!record) {
            return error(res, 'INVALID_OTP', 'No active OTP found. Please request a new one.', 400);
        }

        // ── Brute-force protection: max 3 attempts ──────────────────────
        if (record.attempts >= 3) {
            await record.deleteOne(); // force new OTP request
            return error(res, 'TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new OTP.', 429);
        }

        const valid = verifyOtp(otp, record.otpHash);
        if (!valid) {
            record.attempts += 1;
            await record.save();
            const remaining = 3 - record.attempts;
            return error(res, 'INVALID_OTP', `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 400);
        }

        // Mark verified and update user
        record.verified = true;
        await record.save();

        await User.findByIdAndUpdate(req.user.id, {
            phone: record.phone,
            isPhoneVerified: true
        });

        return success(res, null, 'Phone number verified successfully');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Save user location (city, lat, lng) from browser geolocation
 * @route POST /api/auth/update-location
 * @access Private
 */
exports.updateLocation = async (req, res) => {
    try {
        const { city, latitude, longitude } = req.body;
        const update = {};
        if (city) update.city = city.trim();
        if (latitude !== undefined) update.latitude = latitude;
        if (longitude !== undefined) update.longitude = longitude;

        if (Object.keys(update).length === 0) {
            return error(res, 'VALIDATION_ERROR', 'At least one location field required');
        }

        await User.findByIdAndUpdate(req.user.id, update);
        return success(res, null, 'Location updated');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Check if email is already taken (for inline registration UX)
 * @route GET /api/auth/check-email?email=xxx
 * @access Public
 */
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return error(res, 'VALIDATION_ERROR', 'email query param required');
        const exists = await User.exists({ email: email.trim().toLowerCase() });
        return success(res, { exists: !!exists });
    } catch (err) {
        return serverError(res, err, logger);
    }
};
