const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hostel",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled"],
        default: "pending"
    },
    priceSnapshot: {
        type: Number,
        required: true
    },
    rejectionReason: String,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedAt: Date,
    reviewEligible: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Validation: checkOut must be after checkIn
bookingSchema.pre('save', function (next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

// Comprehensive indexes for performance
bookingSchema.index({ resident: 1, status: 1 });
bookingSchema.index({ room: 1, status: 1 });
bookingSchema.index({ hostel: 1, status: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 }); // For date range queries
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 }); // For overlap detection
bookingSchema.index({ createdAt: -1 }); // For sorting by creation date

module.exports = mongoose.model("Booking", bookingSchema);
