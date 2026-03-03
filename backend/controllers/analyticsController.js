const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const Bill = require('../models/Bill');
const { ROLES, OWNER_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Get comprehensive platform analytics
 * @route   GET /api/admin/analytics
 * @access  Private (superadmin only)
 */
exports.getPlatformAnalytics = async (req, res) => {
    try {
        const now = new Date();

        // ── Revenue by month (last 12 months) ──
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const revenueByMonth = await Bill.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Fill in missing months with 0
        const filledRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const found = revenueByMonth.find(r => r._id.year === year && r._id.month === month);
            filledRevenue.push({
                year,
                month,
                monthName: d.toLocaleString('default', { month: 'short' }),
                revenue: found ? found.revenue : 0,
                count: found ? found.count : 0
            });
        }

        // ── Occupancy rate ──
        const totalRooms = await Hostel.aggregate([
            { $group: { _id: null, total: { $sum: '$totalRooms' } } }
        ]);
        const occupiedRoomCount = await Booking.countDocuments({
            status: 'approved',
            checkOut: { $gte: now }
        });
        const totalRoomCount = totalRooms[0]?.total || 0;
        const occupancyRate = totalRoomCount > 0
            ? Math.round((occupiedRoomCount / totalRoomCount) * 100)
            : 0;

        // ── Top 10 hostels by bookings ──
        const topHostels = await Booking.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$hostel',
                    totalBookings: { $sum: 1 }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'hostels',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'hostelInfo'
                }
            },
            { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    totalBookings: 1,
                    'hostelInfo.name': 1,
                    'hostelInfo.city': 1
                }
            }
        ]);

        // ── Owner growth (last 6 months) ──
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const ownerGrowth = await User.aggregate([
            {
                $match: {
                    role: ROLES.OWNER,
                    ownerStatus: OWNER_STATUS.APPROVED,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    newOwners: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Fill in missing months with 0
        const filledOwnerGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const found = ownerGrowth.find(o => o._id.year === year && o._id.month === month);
            filledOwnerGrowth.push({
                year,
                month,
                monthName: d.toLocaleString('default', { month: 'short' }),
                newOwners: found ? found.newOwners : 0
            });
        }

        // ── Summary stats ──
        const [totalOwners, totalHostels, totalBookings, totalRevenue, pendingBills] = await Promise.all([
            User.countDocuments({ role: ROLES.OWNER, ownerStatus: OWNER_STATUS.APPROVED }),
            Hostel.countDocuments(),
            Booking.countDocuments({ status: 'approved' }),
            Bill.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Bill.countDocuments({ status: 'pending' })
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    totalOwners,
                    totalHostels,
                    totalBookings,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    pendingBills,
                    occupancyRate
                },
                revenueByMonth: filledRevenue,
                ownerGrowth: filledOwnerGrowth,
                topHostels,
                occupancy: {
                    rate: occupancyRate,
                    occupiedRooms: occupiedRoomCount,
                    totalRooms: totalRoomCount
                }
            }
        });
    } catch (error) {
        logger.error('Analytics error', error);
        res.status(500).json({ success: false, error: { code: 'ANALYTICS_FAILED', message: 'Failed to fetch analytics' } });
    }
};
