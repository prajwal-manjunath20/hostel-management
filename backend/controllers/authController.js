const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ROLES } = require('../config/constants');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const { success, created, error: apiError, serverError } = require('../utils/apiResponse');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return apiError(res, 'VALIDATION_ERROR', 'Name, email, and password are required');
    }
    if (name.length > 50) {
      return apiError(res, 'VALIDATION_ERROR', 'Name must be less than 50 characters');
    }
    if (email.length > 100) {
      return apiError(res, 'VALIDATION_ERROR', 'Email must be less than 100 characters');
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return apiError(res, 'VALIDATION_ERROR', 'Invalid email format');
    }
    if (password.length < 8) {
      return apiError(res, 'VALIDATION_ERROR', 'Password must be at least 8 characters');
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!strongPasswordRegex.test(password)) {
      return apiError(res, 'VALIDATION_ERROR', 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)');
    }

    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      return apiError(res, 'EMAIL_EXISTS', 'Email already exists!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = new User({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: role || ROLES.RESIDENT,
      phone: phone?.trim(),
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await user.save();

    // Send verification email (non-blocking)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    console.log("VERIFY LINK:", verificationUrl);
    try {
      await sendEmail(sanitizedEmail, 'emailVerification', {
        name: sanitizedName,
        verificationUrl
      });
    } catch (emailErr) {
      logger.error('Verification email failed', emailErr);
      // Fallback: log token URL in dev so registration can still be tested without email
      logger.debug('[DEV] Email verification token', { email: sanitizedEmail, verificationUrl });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return created(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified }
    }, 'Registration successful! Please check your email to verify your account.');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiError(res, 'VALIDATION_ERROR', 'Email and password are required');
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: sanitizedEmail }).select('+password');
    if (!user) {
      return apiError(res, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Check account suspension
    if (user.accountStatus === 'suspended') {
      return apiError(res, 'ACCOUNT_SUSPENDED', 'Your account has been suspended.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return apiError(res, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    }, 'Login successful');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return success(res, { user }, 'User fetched successfully');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

/**
 * @desc    Verify email address
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return apiError(res, 'INVALID_TOKEN', 'Invalid or expired verification token. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return success(res, null, 'Email verified successfully! You can now use all features.');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

/**
 * @desc    Resend email verification
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return apiError(res, 'ALREADY_VERIFIED', 'Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    try {
      await sendEmail(user.email, 'emailVerification', {
        name: user.name,
        verificationUrl
      });
    } catch (emailErr) {
      logger.error('Resend verification email failed', emailErr);
      logger.debug('[DEV] Resend verification URL', { email: user.email, verificationUrl });
    }

    return success(res, null, 'Verification email sent! Please check your inbox.');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return apiError(res, 'VALIDATION_ERROR', 'Email is required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return success(res, null, 'If an account with that email exists, a password reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await sendEmail(user.email, 'passwordReset', {
        name: user.name,
        resetUrl
      });
    } catch (emailErr) {
      // Clear token if email fails — do not allow reset attempt without email delivery
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      logger.error('Password reset email failed', emailErr);
      logger.debug('[DEV] Password reset URL', { email: user.email, resetUrl });
    }

    return success(res, null, 'If an account with that email exists, a password reset link has been sent.');
  } catch (err) {
    return serverError(res, err, logger);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return apiError(res, 'VALIDATION_ERROR', 'New password is required');
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (password.length < 8 || !strongPasswordRegex.test(password)) {
      return apiError(res, 'VALIDATION_ERROR', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return apiError(res, 'INVALID_TOKEN', 'Invalid or expired reset token. Please request a new password reset.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return success(res, null, 'Password reset successful! You can now login with your new password.');
  } catch (err) {
    return serverError(res, err, logger);
  }
};
