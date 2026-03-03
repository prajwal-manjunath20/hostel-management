const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperadmin } = require('../middleware/role');
const { getPlatformAnalytics } = require('../controllers/analyticsController');

// All routes require superadmin
router.use(protect, requireSuperadmin);

// Platform analytics
router.get('/', getPlatformAnalytics);

module.exports = router;
