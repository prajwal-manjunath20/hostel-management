/**
 * SMS / OTP Service
 *
 * Uses Twilio in production.
 * Falls back to console.log when TWILIO_ACCOUNT_SID is absent (dev mode).
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Generate a 6-digit OTP and its SHA-256 hash.
 * @returns {{ otp: string, hash: string, expiresAt: Date }}
 */
exports.generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { otp, hash, expiresAt };
};

/**
 * Verify a plaintext OTP against its stored hash.
 */
exports.verifyOtp = (plainOtp, storedHash) => {
    const hash = crypto.createHash('sha256').update(plainOtp).digest('hex');
    return hash === storedHash;
};

/**
 * Send OTP via Twilio SMS (or log in dev).
 * @param {string} phone  E.164 format, e.g. +919876543210
 * @param {string} otp    6-digit OTP
 */
exports.sendOtp = async (phone, otp) => {
    const message = `Your StayNest OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`;

    if (!twilioClient) {
        // Dev fallback — print to console, never send real SMS
        logger.info('[DEV] OTP (Twilio not configured)', { phone, otp });
        console.log(`\n📱 [DEV] OTP for ${phone}: ${otp}\n`);
        return { success: true, dev: true };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        logger.info('OTP SMS sent', { phone, sid: result.sid });
        return { success: true, sid: result.sid };
    } catch (err) {
        logger.error('Twilio SMS failed', err, { phone });
        return { success: false, error: err.message };
    }
};
