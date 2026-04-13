'use strict';

const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { uploadFilesToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');
const { success, created, error, serverError } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

/**
 * @desc    Create a new hostel
 * @route   POST /api/hostels
 * @access  Private (approved owners only)
 */
exports.createHostel = async (req, res) => {
    try {
        const {
            name, address, city, totalRooms,
            description, pricePerNight, maxGuests,
            amenities, servicesProvided, staffNames,
            houseRules, cancellationPolicy,
            latitude, longitude
        } = req.body;

        const hostel = await Hostel.create({
            name, address, city, totalRooms,
            description, pricePerNight: pricePerNight || 0,
            maxGuests: maxGuests || 2,
            amenities: amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',')) : [],
            servicesProvided: servicesProvided ? (Array.isArray(servicesProvided) ? servicesProvided : [servicesProvided]) : [],
            staffNames: staffNames ? (Array.isArray(staffNames) ? staffNames : [staffNames]) : [],
            houseRules, cancellationPolicy,
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
            owner: req.user.id,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, message: 'Hostel created successfully', data: hostel });
    } catch (err) {
        logger.error('Create hostel error', err);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create hostel' } });
    }
};

/**
 * @desc    Get all hostels (filtered by ownership)
 * @route   GET /api/hostels
 * @access  Private
 */
exports.getAllHostels = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { search, city, isActive } = req.query;

        // Build filter based on role
        const filter = {};

        // Multi-tenant filtering
        if (req.user.role === ROLES.SUPERADMIN) {
            // Superadmin sees all hostels
        } else if (req.user.role === ROLES.OWNER) {
            // Owners see only their hostels
            filter.owner = req.user.id;
        } else if (req.user.role === ROLES.STAFF && req.user.owner) {
            // Staff see their owner's hostels
            filter.owner = req.user.owner;
        }

        // Apply search filters
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Get total count for pagination
        const total = await Hostel.countDocuments(filter);

        // Get paginated results
        const hostels = await Hostel.find(filter)
            .populate('owner', 'name email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: hostels,
            pagination: getPaginationMeta(total, page, limit)
        });
    } catch (err) {
        logger.error('Get all hostels error', err);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch hostels' } });
    }
};

/**
 * @desc    Get single hostel by ID
 * @route   GET /api/hostels/:id
 * @access  Private
 */
exports.getHostelById = async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id)
            .populate('owner', 'name email');

        if (!hostel) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Hostel not found' } });
        }

        // Multi-tenant isolation: only allow access based on role
        if (req.user.role === ROLES.RESIDENT) {
            // Residents can only view published hostels (same as marketplace)
            if (!hostel.isPublished) {
                return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
            }
        } else if (req.user.role !== ROLES.SUPERADMIN) {
            const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
            if (hostel.owner._id.toString() !== userOwnerId) {
                return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
            }
        }

        res.json({ success: true, data: hostel });
    } catch (err) {
        logger.error('Get hostel error', err);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch hostel' } });
    }
};

/**
 * @desc    Update hostel
 * @route   PATCH /api/hostels/:id
 * @access  Private (owner of hostel or superadmin)
 */
exports.updateHostel = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, address, city, totalRooms,
            description, pricePerNight, maxGuests,
            amenities, servicesProvided, staffNames,
            houseRules, cancellationPolicy,
            latitude, longitude
        } = req.body;

        const hostel = await Hostel.findById(id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        if (req.user.role !== ROLES.SUPERADMIN && hostel.owner.toString() !== req.user.id)
            return res.status(403).json({ error: 'Access denied. You do not own this hostel.' });

        if (name) hostel.name = name;
        if (address) hostel.address = address;
        if (city) hostel.city = city;
        if (totalRooms) hostel.totalRooms = totalRooms;
        if (description !== undefined) hostel.description = description;
        if (pricePerNight !== undefined) hostel.pricePerNight = Number(pricePerNight);
        if (maxGuests !== undefined) hostel.maxGuests = Number(maxGuests);
        if (amenities) hostel.amenities = Array.isArray(amenities) ? amenities : amenities.split(',');
        if (servicesProvided) hostel.servicesProvided = Array.isArray(servicesProvided) ? servicesProvided : [servicesProvided];
        if (staffNames) hostel.staffNames = Array.isArray(staffNames) ? staffNames : [staffNames];
        if (houseRules !== undefined) hostel.houseRules = houseRules;
        if (cancellationPolicy) hostel.cancellationPolicy = cancellationPolicy;
        if (latitude !== undefined) hostel.latitude = Number(latitude);
        if (longitude !== undefined) hostel.longitude = Number(longitude);

        await hostel.save();
        res.json({ success: true, message: 'Hostel updated successfully', data: hostel });
    } catch (error) {
        console.error('Update hostel error:', error);
        res.status(500).json({ error: 'Failed to update hostel' });
    }
};

/**
 * @desc    Upload photos to hostel
 * @route   POST /api/hostels/:id/photos
 * @access  Private (owner)
 */
exports.uploadPhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ success: false, error: 'No files uploaded' });

        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        // Upload to Cloudinary — persistent, deployment-safe
        const urls = await uploadFilesToCloudinary(req.files);
        hostel.photos.push(...urls);
        await hostel.save();

        logger.info('Photos uploaded to Cloudinary', { hostelId: hostel._id, count: urls.length });
        res.json({ success: true, message: `${urls.length} photo(s) uploaded`, data: { photos: hostel.photos } });
    } catch (err) {
        console.error('Upload photos error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
};

/**
 * @desc    Delete a specific photo from hostel
 * @route   DELETE /api/hostels/:id/photos
 * @access  Private (owner)
 */
exports.deletePhoto = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, error: 'Photo URL is required' });

        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        // Verify ownership
        if (req.user.role !== ROLES.SUPERADMIN && hostel.owner.toString() !== req.user.id)
            return res.status(403).json({ error: 'Access denied' });

        // Check if photo exists in array
        if (!hostel.photos.includes(url)) {
            return res.status(404).json({ success: false, error: 'Photo not found in this hostel' });
        }

        // Remove from DB array
        hostel.photos = hostel.photos.filter(p => p !== url);
        await hostel.save();

        // Delete from Cloudinary (don't await to avoid blocking response, or await if you want confirmation)
        try {
            await deleteFromCloudinary(url);
        } catch (cloudinaryErr) {
            logger.error('Failed to delete from Cloudinary but removed from DB', { url });
        }

        res.json({ success: true, message: 'Photo deleted successfully', data: { photos: hostel.photos } });
    } catch (err) {
        console.error('Delete photo error:', err);
        res.status(500).json({ error: 'Deletion failed' });
    }
};

/**
 * @desc    Publish / Unpublish hostel on marketplace
 * @route   PATCH /api/hostels/:id/publish
 * @access  Private (owner)
 */
exports.togglePublish = async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
        hostel.isPublished = !hostel.isPublished;
        await hostel.save();
        res.json({
            success: true,
            message: hostel.isPublished ? 'Hostel published to marketplace' : 'Hostel unpublished',
            data: { isPublished: hostel.isPublished }
        });
    } catch (err) {
        res.status(500).json({ error: 'Toggle publish failed' });
    }
};

/**
 * @desc    Delete hostel
 * @route   DELETE /api/hostels/:id
 * @access  Private (owner of hostel or superadmin)
 */
exports.deleteHostel = async (req, res) => {
    try {
        const { id } = req.params;

        const hostel = await Hostel.findById(id);
        if (!hostel)
            return error(res, 'NOT_FOUND', 'Hostel not found', 404);

        if (req.user.role !== ROLES.SUPERADMIN && hostel.owner.toString() !== req.user.id)
            return error(res, 'FORBIDDEN', 'Access denied. You do not own this hostel.', 403);

        // Block deletion if any rooms exist
        const hasRooms = await Room.exists({ hostelId: id });
        if (hasRooms)
            return error(res, 'HAS_ROOMS', 'Cannot delete hostel with existing rooms. Delete rooms first.');

        // Block deletion if active bookings exist (use .exists() — boolean, no count needed)
        const hasActiveBookings = await Booking.exists({
            hostel: id,
            status: { $in: ['pending', 'approved'] }
        });
        if (hasActiveBookings)
            return error(res, 'HAS_ACTIVE_BOOKINGS',
                'Cannot delete hostel with active or pending bookings.');

        // Cleanup photos from Cloudinary — persistent robustness
        if (hostel.photos && hostel.photos.length > 0) {
            try {
                // Delete all photos associated with this hostel
                await Promise.all(hostel.photos.map(url => deleteFromCloudinary(url)));
                logger.info('Hostel photos cleaned up from Cloudinary', { hostelId: id, count: hostel.photos.length });
            } catch (cloudinaryErr) {
                logger.error('Cloudinary cleanup failed during hostel deletion', { hostelId: id, error: cloudinaryErr.message });
                // We continue with DB deletion even if Cloudinary fails to avoid data desync
            }
        }

        await Hostel.findByIdAndDelete(id);

        logger.info('Hostel deleted', { hostelId: id, userId: req.user.id, requestId: req.id });
        return success(res, null, 'Hostel and all associated photos deleted successfully');
    } catch (err) {
        return serverError(res, err, logger);
    }
};
