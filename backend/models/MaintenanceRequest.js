const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    category: {
        type: String,
        enum: ['plumbing', 'electrical', 'furniture', 'cleaning', 'other'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'cancelled'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolutionNotes: {
        type: String,
        maxlength: 500
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Auto-assign priority based on keywords in title/description
maintenanceRequestSchema.pre('save', function (next) {
    if (this.isNew && this.priority === 'medium') {
        const text = (this.title + ' ' + this.description).toLowerCase();

        if (text.includes('urgent') || text.includes('emergency') || text.includes('immediate')) {
            this.priority = 'urgent';
        } else if (text.includes('broken') || text.includes('not working') || text.includes('damaged')) {
            this.priority = 'high';
        } else if (text.includes('minor') || text.includes('cosmetic')) {
            this.priority = 'low';
        }
    }
    next();
});

// Indexes for performance
maintenanceRequestSchema.index({ resident: 1, createdAt: -1 });
maintenanceRequestSchema.index({ status: 1, priority: -1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });
maintenanceRequestSchema.index({ hostel: 1, status: 1 });
maintenanceRequestSchema.index({ owner: 1, status: 1 }); // Multi-tenant queries

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
