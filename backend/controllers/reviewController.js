const Review = require('../models/Review');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const { success, created, error, serverError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc  Create a review
 * @route POST /api/reviews
 * @access Private (resident only, post-booking)
 */
exports.createReview = async (req, res) => {
    try {
        const { hostelId, bookingId, overallRating, cleanliness, location, communication, value, comment } = req.body;
        const userId = req.user.id;

        if (!overallRating || overallRating < 1 || overallRating > 5)
            return error(res, 'VALIDATION_ERROR', 'overallRating must be between 1 and 5');

        // Validate booking belongs to this user, for this hostel
        const booking = await Booking.findOne({
            _id: bookingId,
            resident: userId,
            hostel: hostelId
        });

        if (!booking)
            return error(res, 'BOOKING_NOT_FOUND', 'No matching booking found', 404);

        // ── Dynamic eligibility: approved + check-out date passed ──────────────
        // No cron job needed — always computed, always correct
        const eligible = booking.status === 'approved' && new Date() > new Date(booking.checkOut);
        if (!eligible)
            return error(res, 'NOT_ELIGIBLE', 'You can only review after your check-out date has passed', 403);

        // Prevent duplicate reviews (unique index enforces, give friendly error)
        const existing = await Review.findOne({ userId, hostelId });
        if (existing)
            return error(res, 'ALREADY_REVIEWED', 'You have already reviewed this hostel', 409);

        const review = await Review.create({
            userId, hostelId, bookingId,
            overallRating, cleanliness, location, communication, value, comment
        });

        // ── O(1) rating update — no fetching all reviews ─────────────────────
        const hostel = await Hostel.findById(hostelId);
        const newCount = (hostel.ratingCount || 0) + 1;
        const newAvg = (((hostel.ratingAverage || 0) * (hostel.ratingCount || 0)) + overallRating) / newCount;

        await Hostel.findByIdAndUpdate(hostelId, {
            ratingAverage: Math.round(newAvg * 10) / 10,
            ratingCount: newCount
        });

        logger.info('Review created', { userId, hostelId, rating: overallRating });
        const populated = await review.populate('userId', 'name');
        return created(res, { review: populated }, 'Review submitted successfully');
    } catch (err) {
        if (err.code === 11000)
            return error(res, 'ALREADY_REVIEWED', 'You have already reviewed this hostel', 409);
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Get reviews for a hostel
 * @route GET /api/reviews/hostel/:hostelId
 * @access Public
 */
exports.getHostelReviews = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const total = await Review.countDocuments({ hostelId });
        const reviews = await Review.find({ hostelId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Rating breakdown (percentage per star)
        const allReviews = await Review.find({ hostelId }, 'overallRating');
        const breakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: allReviews.filter(r => Math.round(r.overallRating) === star).length,
            percentage: total > 0
                ? Math.round((allReviews.filter(r => Math.round(r.overallRating) === star).length / total) * 100)
                : 0
        }));

        // Sub-rating averages
        const subRatings = {};
        if (total > 0) {
            ['cleanliness', 'location', 'communication', 'value'].forEach(key => {
                subRatings[key] = Math.round(
                    (allReviews.reduce((sum, r) => sum + (r[key] || 0), 0) / total) * 10
                ) / 10;
            });
        }

        return success(res, { reviews, breakdown, subRatings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Check if logged-in user can review a hostel
 * @route GET /api/reviews/can-review/:hostelId
 * @access Private
 */
exports.canReview = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const userId = req.user.id;

        // ── Dynamic check: approved booking + check-out date has passed ────────────
        // No stored status mutation — always computed from real data
        const booking = await Booking.findOne({
            resident: userId,
            hostel: hostelId,
            status: 'approved',
            checkOut: { $lt: new Date() }   // check-out must have already occurred
        });

        const alreadyReviewed = await Review.exists({ userId, hostelId });

        return success(res, {
            canReview: !!booking && !alreadyReviewed,
            alreadyReviewed: !!alreadyReviewed,
            bookingId: booking?._id
        });
    } catch (err) {
        return serverError(res, err, logger);
    }
};
