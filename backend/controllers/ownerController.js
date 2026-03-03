const OwnerApplication = require('../models/OwnerApplication');
const User = require('../models/User');
const { ROLES, OWNER_STATUS } = require('../config/constants');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { success, created, error, serverError } = require('../utils/apiResponse');

/**
 * @desc    Apply to become an owner
 * @route   POST /api/owner/apply
 * @access  Private (authenticated users)
 */
exports.applyForOwnership = async (req, res) => {
    try {
        const {
            businessName,
            businessEmail,
            businessPhone,
            businessCity,
            businessAddress,
            businessDescription
        } = req.body;

        const phoneNumber = businessPhone;
        const city = businessCity;
        const description = businessDescription;

        // Check if user already has an application
        const existingApplication = await OwnerApplication.findOne({ user: req.user.id });

        if (existingApplication) {
            return error(res, 'APPLICATION_EXISTS', 'You have already submitted an owner application');
        }

        // Check if user is already an owner
        const user = await User.findById(req.user.id);
        if (user.role === ROLES.OWNER || user.ownerStatus === OWNER_STATUS.APPROVED) {
            return error(res, 'ALREADY_OWNER', 'You are already an approved owner');
        }

        // Create application
        const application = await OwnerApplication.create({
            user: req.user.id,
            businessName,
            businessEmail,
            phoneNumber,
            businessAddress,
            city,
            description,
            status: OWNER_STATUS.PENDING
        });

        // Update user's ownerStatus to pending
        await User.findByIdAndUpdate(req.user.id, { ownerStatus: OWNER_STATUS.PENDING });

        return created(res, application, 'Owner application submitted successfully. Awaiting admin approval.');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc    Get my owner application status
 * @route   GET /api/owner/my-application
 * @access  Private
 */
exports.getMyApplication = async (req, res) => {
    try {
        const application = await OwnerApplication.findOne({ user: req.user.id });

        if (!application) {
            return res.status(404).json({
                error: 'No application found',
                hasApplied: false
            });
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
};

/**
 * @desc    Create staff under owner
 * @route   POST /api/owner/staff
 * @access  Private (approved owners only)
 */
exports.createStaff = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create staff user
        const staff = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            role: ROLES.STAFF,
            owner: req.user.id, // Link to owner
            ownerStatus: OWNER_STATUS.NONE,
            isActive: true
        });

        // Remove password from response
        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.status(201).json({
            success: true,
            message: 'Staff account created successfully',
            data: staffResponse
        });
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ error: 'Failed to create staff account' });
    }
};

/**
 * @desc    Get all staff under owner
 * @route   GET /api/owner/staff
 * @access  Private (owners only)
 */
exports.getMyStaff = async (req, res) => {
    try {
        const staff = await User.find({
            owner: req.user.id,
            role: ROLES.STAFF
        }).select('-password');

        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

/**
 * @desc    Update staff
 * @route   PATCH /api/owner/staff/:id
 * @access  Private (owners only)
 */
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Explicitly reject any attempt to set protected fields.
        // Silently ignoring would hide abuse attempts in logs.
        const BLOCKED_FIELDS = ['role', 'owner', 'ownerStatus', 'accountStatus', 'password', 'email'];
        const attempted = BLOCKED_FIELDS.filter(f => f in req.body);
        if (attempted.length > 0) {
            logger.warn('Blocked field update attempt on staff', {
                userId: req.user.id,
                staffId: id,
                attempted,
                requestId: req.id
            });
            return error(res, 'FIELD_NOT_ALLOWED',
                `Cannot update protected fields: ${attempted.join(', ')}`);
        }

        const { name, phone, isActive } = req.body;

        const staff = await User.findOne({ _id: id, owner: req.user.id, role: ROLES.STAFF });
        if (!staff)
            return error(res, 'NOT_FOUND', 'Staff not found or access denied', 404);

        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (typeof isActive === 'boolean') staff.isActive = isActive;

        await staff.save();

        const staffResponse = staff.toObject();
        delete staffResponse.password;

        return success(res, staffResponse, 'Staff updated successfully');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc    Delete staff
 * @route   DELETE /api/owner/staff/:id
 * @access  Private (owners only)
 */
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete staff
        const staff = await User.findOneAndDelete({
            _id: id,
            owner: req.user.id,
            role: ROLES.STAFF
        });

        if (!staff) {
            return res.status(404).json({ error: 'Staff not found or access denied' });
        }

        res.json({
            success: true,
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Failed to delete staff' });
    }
};
