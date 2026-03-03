const { body } = require("express-validator");

// Create booking validation rules
exports.createBookingValidation = [
    body("roomId")
        .notEmpty()
        .withMessage("Room ID is required")
        .isMongoId()
        .withMessage("Invalid room ID format"),

    body("hostelId")
        .notEmpty()
        .withMessage("Hostel ID is required")
        .isMongoId()
        .withMessage("Invalid hostel ID format"),

    body("checkIn")
        .notEmpty()
        .withMessage("Check-in date is required")
        .isISO8601()
        .withMessage("Invalid check-in date format")
        .custom((value) => {
            const checkInDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (checkInDate < today) {
                throw new Error("Check-in date cannot be in the past");
            }

            const twoYearsFromNow = new Date();
            twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

            if (checkInDate > twoYearsFromNow) {
                throw new Error("Cannot book more than 2 years in advance");
            }

            return true;
        }),

    body("checkOut")
        .notEmpty()
        .withMessage("Check-out date is required")
        .isISO8601()
        .withMessage("Invalid check-out date format")
        .custom((value, { req }) => {
            const checkInDate = new Date(req.body.checkIn);
            const checkOutDate = new Date(value);

            if (checkOutDate <= checkInDate) {
                throw new Error("Check-out must be after check-in");
            }

            const daysDiff = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);

            if (daysDiff < 1) {
                throw new Error("Minimum stay is 1 day");
            }

            const oneYear = 365;
            if (daysDiff > oneYear) {
                throw new Error("Booking duration cannot exceed 1 year");
            }

            return true;
        })
];

// Approve/Reject booking validation
exports.updateBookingStatusValidation = [
    body("status")
        .optional()
        .isIn(["approved", "rejected", "cancelled"])
        .withMessage("Invalid status. Must be approved, rejected, or cancelled")
];
