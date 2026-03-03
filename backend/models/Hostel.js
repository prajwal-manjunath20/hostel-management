const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  // ── Core fields (existing) ──────────────────────────────────────────
  name: { type: String, required: true },
  address: String,
  city: { type: String, index: true },
  totalRooms: Number,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Marketplace listing fields ──────────────────────────────────────
  description: { type: String, maxlength: 3000 },
  pricePerNight: { type: Number, default: 0 },
  maxGuests: { type: Number, default: 2 },

  // Photos: array of relative paths served via /uploads/hostels/
  photos: [{ type: String }],

  amenities: [{
    type: String,
    enum: [
      'WiFi', 'AC', 'Parking', 'Kitchen', 'Laundry', 'TV', 'Gym',
      'Swimming Pool', 'Hot Water', '24x7 Security', 'CCTV',
      'Power Backup', 'Elevator', 'Study Room', 'Cafeteria',
      'Housekeeping', 'Meals Included', 'Locker', 'Reading Light',
      'Common Area'
    ]
  }],

  servicesProvided: [{ type: String }],
  staffNames: [{ type: String }],
  houseRules: { type: String, maxlength: 2000 },
  cancellationPolicy: {
    type: String,
    enum: ['Free cancellation', 'Moderate', 'Strict', 'Non-refundable'],
    default: 'Moderate'
  },

  // Location
  latitude: { type: Number },
  longitude: { type: Number },

  // Rating aggregates (auto-calculated by reviewController)
  ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },

  // Marketplace visibility
  isPublished: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Existing indexes
hostelSchema.index({ owner: 1, name: 1 }, { unique: true });
hostelSchema.index({ owner: 1, createdAt: -1 });
hostelSchema.index({ owner: 1, city: 1 });

// New marketplace indexes
// city:1 index is already created via `index: true` on the field above — no duplicate needed
hostelSchema.index({ pricePerNight: 1 });
hostelSchema.index({ ratingAverage: -1 });
hostelSchema.index({ isPublished: 1, city: 1, ratingAverage: -1 });

// Geospatial index for nearby searches
hostelSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
