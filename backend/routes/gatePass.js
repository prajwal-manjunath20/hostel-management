'use strict';

const express = require('express');
const router = express.Router();
const gatePassController = require('../controllers/gatePassController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// ── Resident ──────────────────────────────────────────────────────────────────
// Create a gate pass request
router.post('/', protect, authorize(ROLES.RESIDENT), gatePassController.createGatePass);

// List own gate passes
router.get('/', protect, authorize(ROLES.RESIDENT), gatePassController.getGatePassesForStudent);

// ── Coordinator ───────────────────────────────────────────────────────────────
// Coordinator approve / reject
router.patch('/:gatePassId/coordinator', protect, authorize(ROLES.STAFF), gatePassController.coordinatorApprove);

// ── Warden (Owner) ────────────────────────────────────────────────────────────
// Warden approve / reject
router.patch('/:gatePassId/warden', protect, authorize(ROLES.OWNER), gatePassController.wardenApprove);

module.exports = router;
