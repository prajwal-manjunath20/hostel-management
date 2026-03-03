const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    location: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    value: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 }
}, { timestamps: true });

// Prevent duplicate reviews: one review per user per hostel
reviewSchema.index({ userId: 1, hostelId: 1 }, { unique: true });
reviewSchema.index({ hostelId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
