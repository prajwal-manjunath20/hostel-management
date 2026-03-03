const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    generateMonthlyBills,
    getMyBills,
    getAllBills,
    getBillById,
    markAsPaid,
    getBillingStats
} = require('../controllers/billController');

// Admin routes
router.post('/generate', protect, authorize('admin'), generateMonthlyBills);
router.get('/stats', protect, authorize('admin'), getBillingStats);
router.get('/', protect, authorize('admin', 'staff'), getAllBills);
router.patch('/:id/pay', protect, authorize('admin'), markAsPaid);

// Resident routes
router.get('/my', protect, authorize('resident'), getMyBills);

// Shared routes
router.get('/:id', protect, getBillById);

module.exports = router;
