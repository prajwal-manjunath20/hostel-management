const MaintenanceRequest = require('../models/MaintenanceRequest');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { sendEmail } = require('../services/emailService');
const Booking = require('../models/Booking');
const { ROLES } = require('../config/constants');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

// Create maintenance request (resident only)
exports.createRequest = async (req, res) => {
    try {
        const { hostelId, roomId, title, description, category } = req.body;

        // Verify resident has an active booking for this room
        const activeBooking = await Booking.findOne({
            resident: req.user.id,
            room: roomId,
            hostel: hostelId,
            status: 'approved'
        });

        if (!activeBooking) {
            return res.status(403).json({
                error: 'You can only submit maintenance requests for rooms you have booked'
            });
        }

        // Get hostel owner for multi-tenant tracking
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        const request = await MaintenanceRequest.create({
            resident: req.user.id,
            hostel: hostelId,
            room: roomId,
            owner: hostel.owner, // Track owner for filtering
            title,
            description,
            category
        });

        const populatedRequest = await MaintenanceRequest.findById(request._id)
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber');

        res.status(201).json(populatedRequest);
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Failed to create maintenance request' });
    }
};

// Get user's maintenance requests (resident)
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await MaintenanceRequest.find({ resident: req.user.id })
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

// Get all maintenance requests (filtered by ownership)
exports.getAllRequests = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { status, priority, category, assignedTo } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedTo) filter.assignedTo = assignedTo;

        // Multi-tenant filtering
        if (req.user.role === ROLES.SUPERADMIN) {
            // Superadmin sees all requests
        } else if (req.user.role === ROLES.OWNER) {
            filter.owner = req.user.id;
        } else if (req.user.role === ROLES.STAFF && req.user.owner) {
            filter.owner = req.user.owner;
        }

        const total = await MaintenanceRequest.countDocuments(filter);

        const requests = await MaintenanceRequest.find(filter)
            .populate('resident', 'name email phone')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('assignedTo', 'name')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ priority: -1, createdAt: -1 });

        res.json({
            success: true,
            data: requests,
            pagination: getPaginationMeta(total, page, limit)
        });
    } catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

// Update request status (staff)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await MaintenanceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        request.status = status;
        await request.save();

        const updatedRequest = await MaintenanceRequest.findById(id)
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('assignedTo', 'name');

        res.json(updatedRequest);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// Assign request to staff (admin/staff)
exports.assignRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;

        const request = await MaintenanceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Allow staff to self-assign or admin to assign to anyone
        if (req.user.role === 'staff' && staffId !== req.user.id) {
            return res.status(403).json({ error: 'Staff can only self-assign' });
        }

        request.assignedTo = staffId;
        if (request.status === 'pending') {
            request.status = 'in-progress';
        }
        await request.save();

        const updatedRequest = await MaintenanceRequest.findById(id)
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('assignedTo', 'name');

        res.json(updatedRequest);
    } catch (error) {
        console.error('Assign request error:', error);
        res.status(500).json({ error: 'Failed to assign request' });
    }
};

// Resolve request (staff)
exports.resolveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNotes } = req.body;

        const request = await MaintenanceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Verify staff is assigned to this request
        if (req.user.role === 'staff' && request.assignedTo?.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only resolve requests assigned to you' });
        }

        request.status = 'resolved';
        request.resolutionNotes = resolutionNotes;
        request.resolvedAt = new Date();
        await request.save();

        const updatedRequest = await MaintenanceRequest.findById(id)
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('assignedTo', 'name');

        // Send email to resident
        await sendEmail(
            updatedRequest.resident.email,
            'maintenanceResolved',
            {
                residentName: updatedRequest.resident.name,
                category: updatedRequest.category,
                resolution: resolutionNotes,
                staffName: updatedRequest.assignedTo.name
            }
        );

        res.json(updatedRequest);
    } catch (error) {
        console.error('Resolve request error:', error);
        res.status(500).json({ error: 'Failed to resolve request' });
    }
};

// Cancel request (resident)
exports.cancelRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await MaintenanceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Verify ownership
        if (request.resident.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only cancel your own requests' });
        }

        // Can only cancel pending requests
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Can only cancel pending requests' });
        }

        request.status = 'cancelled';
        await request.save();

        const updatedRequest = await MaintenanceRequest.findById(id)
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber');

        res.json(updatedRequest);
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ error: 'Failed to cancel request' });
    }
};
