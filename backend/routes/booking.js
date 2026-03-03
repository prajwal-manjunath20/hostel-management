const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const bookingController = require("../controllers/bookingController");
const { createBookingValidation } = require("../validations/bookingValidation");
const validate = require("../middleware/validate");

// Create booking (Resident only) with validation
router.post("/", protect, authorize("resident"), createBookingValidation, validate, bookingController.createBooking);

// Get user's own bookings (Resident)
router.get("/my", protect, authorize("resident"), bookingController.getMyBookings);

// Get all bookings (Admin/Staff)
router.get("/", protect, authorize("admin", "staff"), bookingController.getAllBookings);

// Approve booking (Admin only)
router.patch("/:id/approve", protect, authorize("admin"), bookingController.approveBooking);

// Reject booking (Admin only)
router.patch("/:id/reject", protect, authorize("admin"), bookingController.rejectBooking);

// Cancel booking (Resident)
router.patch("/:id/cancel", protect, authorize("resident"), bookingController.cancelBooking);

module.exports = router;
