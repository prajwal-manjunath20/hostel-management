const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireOwner } = require('../middleware/role');
const { checkStaffOwnership } = require('../middleware/ownership');
const { ownerApplicationLimiter } = require('../middleware/rateLimiter');
const { checkOwnerAccountStatus } = require('../middleware/accountStatus');
const { requireVerifiedEmail } = require('../middleware/emailVerification');
const {
    applyForOwnership,
    getMyApplication,
    createStaff,
    getMyStaff,
    updateStaff,
    deleteStaff
} = require('../controllers/ownerController');

// Owner application routes (with rate limiting + email verification required)
router.post('/apply', protect, requireVerifiedEmail, ownerApplicationLimiter, applyForOwnership);
router.get('/my-application', protect, getMyApplication);

// Staff management routes (owners only, check account status)
router.post('/staff', protect, requireOwner, checkOwnerAccountStatus, createStaff);
router.get('/staff', protect, requireOwner, checkOwnerAccountStatus, getMyStaff);
router.patch('/staff/:id', protect, requireOwner, checkOwnerAccountStatus, checkStaffOwnership, updateStaff);
router.delete('/staff/:id', protect, requireOwner, checkOwnerAccountStatus, checkStaffOwnership, deleteStaff);

module.exports = router;
