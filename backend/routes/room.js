const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { requireOwnerOrStaff, requireOwner, requireSuperadminOrOwner } = require("../middleware/role");
const { checkRoomOwnership } = require("../middleware/ownership");
const {
  createRoom,
  getRoomsByHostel,
  getAllRooms,
  updateRoom,
  deleteRoom
} = require("../controllers/roomController");

// Create room (owners and staff)
router.post("/", protect, requireOwnerOrStaff, createRoom);

// Get all rooms (filtered by ownership)
router.get("/", protect, getAllRooms);

// Get rooms by hostel
router.get("/:hostelId", protect, getRoomsByHostel);

// Update room (owners and staff)
router.patch("/:id", protect, requireOwnerOrStaff, checkRoomOwnership, updateRoom);

// Delete room (owners only)
router.delete("/:id", protect, requireSuperadminOrOwner, checkRoomOwnership, deleteRoom);

module.exports = router;

