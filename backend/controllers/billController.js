const Bill = require('../models/Bill');
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const Counter = require('../models/Counter');
const { sendEmail } = require('../services/emailService');
const { ROLES } = require('../config/constants');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');
const { success, created, error, serverError } = require('../utils/apiResponse');

// Generate monthly bills for all active bookings (Owner/Admin only)
exports.generateMonthlyBills = async (req, res) => {
    try {
        const { month, year } = req.body;
        const billingMonth = month || new Date().getMonth() + 1;
        const billingYear = year || new Date().getFullYear();

        // Scope to owner unless superadmin
        const ownerFilter = req.user.role === ROLES.SUPERADMIN ? {} : { owner: req.user.id };

        // Check if bills already exist for this period under this owner
        const existingBills = await Bill.exists({
            ...ownerFilter,
            'billingPeriod.month': billingMonth,
            'billingPeriod.year': billingYear
        });
        if (existingBills)
            return error(res, 'BILLS_ALREADY_GENERATED',
                `Bills for ${billingMonth}/${billingYear} have already been generated`);

        // Find approved bookings scoped to tenant
        let bookingFilter = { status: 'approved' };
        if (req.user.role !== ROLES.SUPERADMIN) {
            const ownerHostels = await Hostel.find({ owner: req.user.id }).distinct('_id');
            bookingFilter.hostel = { $in: ownerHostels };
        }

        const activeBookings = await Booking.find(bookingFilter)
            .populate('resident')
            .populate('room')
            .populate('hostel');

        if (activeBookings.length === 0)
            return error(res, 'NO_ACTIVE_BOOKINGS', 'No active bookings found', 404);

        const bills = [];
        const dueDate = new Date(billingYear, billingMonth - 1, 5);

        for (const booking of activeBookings) {
            const ownerId = booking.hostel.owner.toString();
            // Atomic sequential invoice number per tenant
            const seq = await Counter.nextSeq(`invoice_${ownerId}_${billingYear}${String(billingMonth).padStart(2, '0')}`);
            const invoiceNumber = `INV-${billingYear}${String(billingMonth).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;

            const bill = await Bill.create({
                resident: booking.resident._id,
                booking: booking._id,
                hostel: booking.hostel._id,
                room: booking.room._id,
                owner: booking.hostel.owner,
                amount: booking.priceSnapshot,
                invoiceNumber,
                dueDate,
                billingPeriod: { month: billingMonth, year: billingYear },
                status: 'pending'
            });
            bills.push(bill);

            sendEmail(booking.resident.email, 'billGenerated', {
                residentName: booking.resident.name,
                invoiceNumber: bill.invoiceNumber,
                amount: bill.amount,
                dueDate: bill.dueDate,
                month: billingMonth,
                year: billingYear
            }).catch(e => logger.error('Bill email failed', e));
        }

        const populatedBills = await Bill.find({ _id: { $in: bills.map(b => b._id) } })
            .populate('resident', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber');

        logger.info('Monthly bills generated', { count: bills.length, month: billingMonth, year: billingYear, userId: req.user.id });
        return created(res, populatedBills, `Generated ${bills.length} bills for ${billingMonth}/${billingYear}`);
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// Get user's own bills (Resident)
exports.getMyBills = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const total = await Bill.countDocuments({ resident: req.user.id });
        const bills = await Bill.find({ resident: req.user.id })
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('booking')
            .sort({ dueDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return success(res, bills, 'Bills fetched', getPaginationMeta(total, page, limit));
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// Get all bills with filters (filtered by ownership)
exports.getAllBills = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { status, hostelId, month, year } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (hostelId) filter.hostel = hostelId;
        if (month && year) {
            filter['billingPeriod.month'] = parseInt(month);
            filter['billingPeriod.year'] = parseInt(year);
        }

        // Multi-tenant filtering
        if (req.user.role === ROLES.SUPERADMIN) {
            // Superadmin sees all bills
        } else if (req.user.role === ROLES.OWNER) {
            filter.owner = req.user.id;
        } else if (req.user.role === ROLES.STAFF && req.user.owner) {
            filter.owner = req.user.owner;
        }

        const total = await Bill.countDocuments(filter);

        const bills = await Bill.find(filter)
            .populate('resident', 'name email phone')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('paidBy', 'name')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ dueDate: -1 });

        return success(res, bills, 'Bills fetched', getPaginationMeta(total, page, limit));
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// Get single bill by ID
exports.getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        // Build filter: residents can only see their own bill
        const filter = { _id: id };
        if (req.user.role === ROLES.RESIDENT) filter.resident = req.user.id;
        else if (req.user.role === ROLES.OWNER) filter.owner = req.user.id;
        else if (req.user.role === ROLES.STAFF && req.user.owner) filter.owner = req.user.owner;

        const bill = await Bill.findOne(filter)
            .populate('resident', 'name email phone')
            .populate('hostel', 'name address')
            .populate('room', 'roomNumber type')
            .populate('booking')
            .populate('paidBy', 'name');

        if (!bill)
            return error(res, 'NOT_FOUND', 'Bill not found or access denied', 404);

        return success(res, bill, 'Bill fetched');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// Mark bill as paid (atomic with tenant guard)
exports.markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, notes } = req.body;

        // Atomic filter: ID + owner (tenant guard) + unpaid status
        // Prevents: double payment, cross-tenant marking
        const ownerFilter = req.user.role === ROLES.SUPERADMIN ? {} : { owner: req.user.id };
        const bill = await Bill.findOneAndUpdate(
            { _id: id, ...ownerFilter, status: { $in: ['pending', 'overdue'] } },
            {
                status: 'paid',
                paidDate: new Date(),
                paymentMethod: paymentMethod || 'cash',
                paidBy: req.user.id,
                ...(notes ? { notes } : {})
            },
            { new: true }
        ).populate('resident', 'name email phone')
            .populate('hostel', 'name')
            .populate('room', 'roomNumber')
            .populate('paidBy', 'name');

        if (!bill)
            return error(res, 'BILL_NOT_PAYABLE',
                'Bill not found, already paid, or access denied', 409);

        logger.info('Bill marked paid', { billId: id, userId: req.user.id, requestId: req.id });
        return success(res, bill, 'Bill marked as paid');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// Get billing statistics (owner-scoped — no cross-tenant leak)
exports.getBillingStats = async (req, res) => {
    try {
        // Tenant filter applied to EVERY aggregation pipeline
        const ownerMatch = req.user.role === ROLES.SUPERADMIN ? {}
            : req.user.role === ROLES.OWNER ? { owner: req.user.id }
                : req.user.owner ? { owner: req.user.owner }
                    : { owner: null }; // fallback: see nothing

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const [pending, overdue, collected, monthly] = await Promise.all([
            Bill.aggregate([{ $match: { ...ownerMatch, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Bill.aggregate([{ $match: { ...ownerMatch, status: 'overdue' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Bill.aggregate([{ $match: { ...ownerMatch, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Bill.aggregate([
                { $match: { ...ownerMatch, 'billingPeriod.month': currentMonth, 'billingPeriod.year': currentYear } },
                { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
            ])
        ]);

        return success(res, {
            totalPending: pending[0]?.total || 0,
            totalOverdue: overdue[0]?.total || 0,
            totalCollected: collected[0]?.total || 0,
            currentMonth: { month: currentMonth, year: currentYear, stats: monthly }
        }, 'Billing stats fetched');
    } catch (err) {
        return serverError(res, err, logger);
    }
};
