const Hostel = require('../models/Hostel');
const User = require('../models/User');
const { success, serverError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc  Public hostel search
 * @route GET /api/marketplace/hostels
 * @access Public
 */
exports.searchHostels = async (req, res) => {
    try {
        const {
            city, minPrice, maxPrice, guests, amenities, search,
            page = 1, limit = 12, sort = 'rating'
        } = req.query;

        const filter = { isPublished: true };

        if (city) filter.city = { $regex: city.trim(), $options: 'i' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (minPrice || maxPrice) {
            filter.pricePerNight = {};
            if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
        }
        if (guests) filter.maxGuests = { $gte: Number(guests) };
        if (amenities) {
            const list = amenities.split(',').map(a => a.trim());
            filter.amenities = { $all: list };
        }

        const sortMap = {
            rating: { ratingAverage: -1 },
            price_asc: { pricePerNight: 1 },
            price_desc: { pricePerNight: -1 },
            newest: { createdAt: -1 }
        };
        const sortQuery = sortMap[sort] || sortMap.rating;

        const total = await Hostel.countDocuments(filter);
        const hostels = await Hostel.find(filter)
            .populate('owner', 'name createdAt')
            .sort(sortQuery)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .select('name city address description pricePerNight maxGuests photos amenities ratingAverage ratingCount cancellationPolicy owner latitude longitude');

        // If user is logged-in and searching by city, log search history
        if (req.user && city) {
            try {
                await User.findByIdAndUpdate(req.user.id, {
                    $push: {
                        searchHistory: {
                            $each: [{
                                city,
                                priceMin: minPrice ? Number(minPrice) : undefined,
                                priceMax: maxPrice ? Number(maxPrice) : undefined,
                                amenities: amenities ? amenities.split(',') : []
                            }],
                            $slice: -20  // keep last 20 searches
                        }
                    }
                });
            } catch (_) { /* non-critical */ }
        }

        return success(res, {
            hostels,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
        });
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Get single public hostel detail
 * @route GET /api/marketplace/hostels/:id
 * @access Public
 */
exports.getPublicHostel = async (req, res) => {
    try {
        const hostel = await Hostel.findOne({ _id: req.params.id, isPublished: true })
            .populate('owner', 'name email createdAt');

        if (!hostel) {
            return success(res, null, 'Hostel not found or not published', 404);
        }

        // Years on platform
        const yearsHosting = hostel.owner?.createdAt
            ? Math.max(1, new Date().getFullYear() - new Date(hostel.owner.createdAt).getFullYear())
            : 1;

        return success(res, { hostel: { ...hostel.toObject(), yearsHosting } });
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc  Get personalised recommendations for logged-in user
 * @route GET /api/marketplace/recommendations
 * @access Private
 */
exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('city searchHistory');
        const filter = { isPublished: true };

        // Nearby — same city as user
        if (user.city) filter.city = { $regex: user.city, $options: 'i' };

        const nearby = await Hostel.find(filter)
            .sort({ ratingAverage: -1 })
            .limit(6)
            .select('name city pricePerNight photos ratingAverage ratingCount cancellationPolicy');

        // Guest Favorites (rating > 4.7)
        const favorites = await Hostel.find({ isPublished: true, ratingAverage: { $gte: 4.7 } })
            .sort({ ratingAverage: -1 })
            .limit(6)
            .select('name city pricePerNight photos ratingAverage ratingCount cancellationPolicy');

        // Budget stays (cheapest)
        const budget = await Hostel.find({ isPublished: true })
            .sort({ pricePerNight: 1 })
            .limit(6)
            .select('name city pricePerNight photos ratingAverage ratingCount cancellationPolicy');

        // Weekend escapes (recently listed)
        const weekend = await Hostel.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .select('name city pricePerNight photos ratingAverage ratingCount cancellationPolicy');

        return success(res, { nearby, favorites, budget, weekend });
    } catch (err) {
        return serverError(res, err, logger);
    }
};
