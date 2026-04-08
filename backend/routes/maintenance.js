const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateStatus,
    assignRequest,
    resolveRequest,
    cancelRequest
} = require('../controllers/maintenanceController');

// Resident routes
router.post('/', protect, authorize('resident'), createRequest);
router.get('/my', protect, authorize('resident'), getMyRequests);
router.patch('/:id/cancel', protect, authorize('resident'), cancelRequest);

// Staff routes
router.get('/', protect, authorize('staff', 'admin', 'superadmin', 'owner'), getAllRequests);
router.patch('/:id/status', protect, authorize('staff', 'admin', 'superadmin', 'owner'), updateStatus);
router.patch('/:id/assign', protect, authorize('staff', 'admin', 'superadmin', 'owner'), assignRequest);
router.patch('/:id/resolve', protect, authorize('staff', 'admin', 'superadmin', 'owner'), resolveRequest);

module.exports = router;
