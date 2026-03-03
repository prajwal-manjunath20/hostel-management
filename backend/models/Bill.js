const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    // Multi-tenant: owner of the hostel (for filtering)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    paidDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'upi', 'card', 'online', 'other'],
        default: null
    },
    billingPeriod: {
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true }
    },
    notes: {
        type: String
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who marked as paid
    }
}, {
    timestamps: true
});

// NOTE: Invoice numbers are now generated atomically by billController
// using Counter.nextSeq() — the pre-save hook is intentionally removed
// to prevent the sequential counter race condition.

// Update status to overdue if past due date
BillSchema.pre('find', function () {
    const now = new Date();
    this.model.updateMany(
        {
            status: 'pending',
            dueDate: { $lt: now }
        },
        { status: 'overdue' }
    ).exec();
});

// Performance indexes
BillSchema.index({ resident: 1, status: 1 });
BillSchema.index({ owner: 1, status: 1 });          // Tenant scoped billing queries
BillSchema.index({ owner: 1, status: 1, dueDate: 1 }); // Analytics aggregations
BillSchema.index({ status: 1, dueDate: 1 });         // Overdue detection
// invoiceNumber index is implicit from unique:true on the field — no separate .index() needed
BillSchema.index({ 'billingPeriod.year': 1, 'billingPeriod.month': 1 });

module.exports = mongoose.model('Bill', BillSchema);
