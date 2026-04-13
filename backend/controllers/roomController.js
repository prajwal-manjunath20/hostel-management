const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { ROLES } = require('../config/constants');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private (owners and staff)
 */
exports.createRoom = async (req, res) => {
    try {
        const { hostelId, roomNumber, type, capacity, pricePerMonth } = req.body;

        // Verify hostel exists
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Check ownership
        const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
        if (req.user.role !== ROLES.SUPERADMIN && hostel.owner.toString() !== userOwnerId) {
            return res.status(403).json({ error: 'Access denied. You do not own this hostel.' });
        }

        // Create room with owner inherited from hostel
        const room = await Room.create({
            hostelId,
            owner: hostel.owner, // Inherit owner from hostel
            roomNumber,
            type,
            capacity,
            pricePerMonth,
            isAvailable: true
        });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
};

/**
 * @desc    Bulk create rooms for a hostel
 * @route   POST /api/rooms/bulk
 * @access  Private (owners/staff)
 */
exports.bulkCreateRooms = async (req, res) => {
    try {
        const { hostelId, rooms } = req.body;
        if (!hostelId || !rooms || !Array.isArray(rooms)) {
            return res.status(400).json({ error: 'HostelId and an array of rooms are required' });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        // Check ownership
        const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
        if (req.user.role !== ROLES.SUPERADMIN && hostel.owner.toString() !== userOwnerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Prepare rooms for insertion
        const roomsToInsert = rooms.map(r => ({
            hostelId,
            owner: hostel.owner,
            roomNumber: r.roomNumber,
            type: r.type || 'single',
            capacity: r.capacity || 1,
            pricePerMonth: r.pricePerMonth || 0,
            isAvailable: true
        }));

        const createdRooms = await Room.insertMany(roomsToInsert);

        res.status(201).json({
            success: true,
            message: `${createdRooms.length} rooms created successfully`,
            data: createdRooms
        });
    } catch (error) {
        console.error('Bulk create rooms error:', error);
        res.status(500).json({ error: 'Failed to bulk create rooms' });
    }
};

/**
 * @desc    Get rooms by hostel
 * @route   GET /api/rooms/:hostelId
 * @access  Private
 */
exports.getRoomsByHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        // Verify hostel exists
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Check ownership (except for residents who can view all)
        if (req.user.role !== ROLES.RESIDENT && req.user.role !== ROLES.SUPERADMIN) {
            const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
            if (hostel.owner.toString() !== userOwnerId) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const rooms = await Room.find({ hostelId })
            .populate('hostelId', 'name')
            .sort({ roomNumber: 1 });

        res.json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

/**
 * @desc    Get all rooms (filtered by ownership)
 * @route   GET /api/rooms
 * @access  Private
 */
exports.getAllRooms = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { hostelId, isAvailable, roomType, minPrice, maxPrice } = req.query;

        // Build filter
        const filter = {};

        // Multi-tenant filtering
        if (req.user.role === ROLES.SUPERADMIN) {
            // Superadmin sees all rooms
        } else if (req.user.role === ROLES.OWNER) {
            // Owners see only their rooms
            filter.owner = req.user.id;
        } else if (req.user.role === ROLES.STAFF && req.user.owner) {
            // Staff see their owner's rooms
            filter.owner = req.user.owner;
        }

        // Apply filters
        if (hostelId) filter.hostel = hostelId;
        if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
        if (roomType) filter.roomType = roomType;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        // Get total count
        const total = await Room.countDocuments(filter);

        // Get paginated results
        const rooms = await Room.find(filter)
            .populate('hostel', 'name address city')
            .populate('owner', 'name email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: rooms,
            pagination: getPaginationMeta(total, page, limit)
        });
    } catch (error) {
        console.error('Get all rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

/**
 * @desc    Update room
 * @route   PATCH /api/rooms/:id
 * @access  Private (owner or staff)
 */
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, type, capacity, pricePerMonth, isAvailable } = req.body;

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check ownership
        const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
        if (req.user.role !== ROLES.SUPERADMIN && room.owner.toString() !== userOwnerId) {
            return res.status(403).json({ error: 'Access denied. You do not own this room.' });
        }

        // Update fields
        if (roomNumber) room.roomNumber = roomNumber;
        if (type) room.type = type;
        if (capacity) room.capacity = capacity;
        if (pricePerMonth) room.pricePerMonth = pricePerMonth;
        if (typeof isAvailable === 'boolean') room.isAvailable = isAvailable;

        await room.save();

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: room
        });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
};

/**
 * @desc    Delete room
 * @route   DELETE /api/rooms/:id
 * @access  Private (owner only)
 */
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check ownership (only owners can delete, not staff)
        if (req.user.role !== ROLES.SUPERADMIN &&
            (req.user.role !== ROLES.OWNER || room.owner.toString() !== req.user.id)) {
            return res.status(403).json({ error: 'Access denied. Only owners can delete rooms.' });
        }

        await Room.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
};
