'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Routes that require a verified email address.
 * Centralized here so the check never lives in controllers.
 */
const EMAIL_SENSITIVE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];
const EMAIL_SENSITIVE_PREFIXES = [
  '/api/owner',
  '/api/bookings',
  '/api/bills',
  '/api/hostels',
  '/api/rooms',
  '/api/maintenance'
];

function isSensitiveRoute(req) {
  if (!EMAIL_SENSITIVE_METHODS.includes(req.method)) return false;
  return EMAIL_SENSITIVE_PREFIXES.some(prefix => req.path.startsWith(prefix));
}

/**
 * protect — verifies JWT and DB-fetches the user on every request.
 *
 * This is required for SaaS so that:
 *  1. Suspended accounts are blocked immediately (not on token expiry)
 *  2. Email-unverified accounts are blocked from sensitive flows
 *
 * The DB fetch adds ~1ms per request on a local network — acceptable for correctness.
 */
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Not authorized, no token' }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Not authorized, token failed' }
      });
    }

    // DB fetch — real-time enforcement of account state
    const user = await User.findById(decoded.id).select(
      'name email role owner accountStatus isEmailVerified ownerStatus'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account no longer exists' }
      });
    }

    // Real-time suspension check — blocked immediately, not on token expiry
    if (user.accountStatus === 'suspended') {
      logger.warn('Suspended user attempted access', {
        userId: user._id.toString(),
        path: req.path,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Contact support.'
        }
      });
    }

    // Centralized email verification guard for sensitive routes
    if (!user.isEmailVerified && isSensitiveRoute(req)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before performing this action.'
        }
      });
    }

    // Attach full DB user to request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      owner: user.owner?.toString(),
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      ownerStatus: user.ownerStatus
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error' }
    });
  }
};

/**
 * authorize — role check (used alongside protect).
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHORIZED', message: 'Not authorized' }
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${req.user.role}' is not authorized to access this route`
        }
      });
    }
    next();
  };
};
