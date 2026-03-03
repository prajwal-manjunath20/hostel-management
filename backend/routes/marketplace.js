const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    searchHostels,
    getPublicHostel,
    getRecommendations
} = require('../controllers/marketplaceController');

// Public
router.get('/hostels', searchHostels);
router.get('/hostels/:id', getPublicHostel);

// Protected (optional auth — searchHostels logs search history if logged in)
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
