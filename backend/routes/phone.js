'use strict';

const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const { protect } = require('../middleware/auth');

// ── Phone OTP ─────────────────────────────────────────────────────────────────
// Send OTP to phone number
router.post('/send-otp', protect, phoneController.sendPhoneOtp);

// Verify OTP and mark phone as verified
router.post('/verify-otp', protect, phoneController.verifyPhoneOtp);

// ── Location ──────────────────────────────────────────────────────────────────
// Save user city / lat / lng from browser geolocation
router.post('/update-location', protect, phoneController.updateLocation);

// ── Utilities ─────────────────────────────────────────────────────────────────
// Check if email is already taken (public — for inline registration UX)
router.get('/check-email', phoneController.checkEmail);

module.exports = router;
