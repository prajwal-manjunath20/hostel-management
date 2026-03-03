const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", index: true },
  // Multi-tenant: owner of this room (inherited from hostel)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  roomNumber: String,
  type: { type: String, enum: ["single", "double", "dorm"] },
  capacity: Number,
  pricePerMonth: Number,
  isAvailable: { type: Boolean, default: true, index: true }
});

// Indexes for performance
roomSchema.index({ hostelId: 1, isAvailable: 1 });
roomSchema.index({ owner: 1, hostelId: 1 }); // Multi-tenant queries

module.exports = mongoose.model("Room", roomSchema);
