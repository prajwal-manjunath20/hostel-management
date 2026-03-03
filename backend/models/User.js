const mongoose = require('mongoose');
const { ROLES, OWNER_STATUS } = require('../config/constants');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }, // Don't return password in queries
  role: {
    type: String,
    enum: [ROLES.SUPERADMIN, ROLES.OWNER, ROLES.STAFF, ROLES.RESIDENT],
    default: ROLES.RESIDENT,
    index: true
  },
  // Owner application status
  ownerStatus: {
    type: String,
    enum: [OWNER_STATUS.NONE, OWNER_STATUS.PENDING, OWNER_STATUS.APPROVED, OWNER_STATUS.REJECTED],
    default: OWNER_STATUS.NONE,
    index: true
  },
  // Account suspension system
  accountStatus: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  suspensionReason: String,
  suspendedAt: Date,
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For staff: reference to their owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  phone: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  isActive: { type: Boolean, default: true },

  // Geolocation
  city: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },

  // Search history for recommendations
  searchHistory: [{
    city: String,
    priceMin: Number,
    priceMax: Number,
    amenities: [String],
    searchedAt: { type: Date, default: Date.now }
  }],

  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Incremented on password reset — allows invalidating old JWTs if needed
  passwordVersion: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound indexes for multi-tenant queries
UserSchema.index({ role: 1, ownerStatus: 1 });
UserSchema.index({ owner: 1, role: 1 });

// Validation: Staff must have an owner
UserSchema.pre('save', function (next) {
  if (this.role === ROLES.STAFF && !this.owner) {
    return next(new Error('Staff users must be linked to an owner'));
  }

  // Owners must have approved status
  if (this.role === ROLES.OWNER && this.ownerStatus !== OWNER_STATUS.APPROVED) {
    return next(new Error('Owner role requires approved ownerStatus'));
  }

  next();
});

module.exports = mongoose.model('User', UserSchema);
