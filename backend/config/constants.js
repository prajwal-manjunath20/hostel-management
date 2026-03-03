// Constants for the application

// User Roles
const ROLES = {
    SUPERADMIN: 'superadmin',
    OWNER: 'owner',
    STAFF: 'staff',
    RESIDENT: 'resident',
    // Legacy support
    ADMIN: 'admin' // Will be migrated to superadmin
};

// Owner Application Status
const OWNER_STATUS = {
    NONE: 'none',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Booking Status
const BOOKING_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
};

// Maintenance Request Status
const MAINTENANCE_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled'
};

// Maintenance Priority
const MAINTENANCE_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Bill Status
const BILL_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
};

// Payment Methods
const PAYMENT_METHODS = {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    UPI: 'upi',
    CARD: 'card',
    ONLINE: 'online',
    OTHER: 'other'
};

// Room Types
const ROOM_TYPES = {
    SINGLE: 'single',
    DOUBLE: 'double',
    DORM: 'dorm'
};

// Maintenance Categories
const MAINTENANCE_CATEGORIES = {
    PLUMBING: 'plumbing',
    ELECTRICAL: 'electrical',
    FURNITURE: 'furniture',
    CLEANING: 'cleaning',
    OTHER: 'other'
};

// API Response Helper
const apiResponse = (success, message, data = null, error = null) => {
    const response = { success, message };
    if (data) response.data = data;
    if (error) response.error = error;
    return response;
};

module.exports = {
    ROLES,
    OWNER_STATUS,
    BOOKING_STATUS,
    MAINTENANCE_STATUS,
    MAINTENANCE_PRIORITY,
    BILL_STATUS,
    PAYMENT_METHODS,
    ROOM_TYPES,
    MAINTENANCE_CATEGORIES,
    apiResponse
};
