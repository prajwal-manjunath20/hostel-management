const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperadmin } = require('../middleware/role');
const {
    getOwnerRequests,
    approveOwner,
    rejectOwner,
    getAllOwners,
    getPlatformStats
} = require('../controllers/superadminController');
const {
    suspendOwner,
    activateOwner
} = require('../controllers/accountController');

// All routes require superadmin role
router.use(protect, requireSuperadmin);

// Owner management
router.get('/owner-requests', requireSuperadmin, getOwnerRequests);
router.patch('/approve-owner/:id', requireSuperadmin, approveOwner);
router.patch('/reject-owner/:id', requireSuperadmin, rejectOwner);
router.get('/all-owners', requireSuperadmin, getAllOwners);

// Account suspension
router.patch('/suspend-owner/:id', requireSuperadmin, suspendOwner);
router.patch('/activate-owner/:id', requireSuperadmin, activateOwner);

// Platform statistics
router.get('/platform-stats', requireSuperadmin, getPlatformStats);

module.exports = router;
