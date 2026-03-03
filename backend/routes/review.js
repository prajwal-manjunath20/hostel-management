const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getHostelReviews, canReview } = require('../controllers/reviewController');

// Public
router.get('/hostel/:hostelId', getHostelReviews);

// Protected
router.post('/', protect, createReview);
router.get('/can-review/:hostelId', protect, canReview);

module.exports = router;
