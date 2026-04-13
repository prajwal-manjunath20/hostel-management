const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { requireOwnerOrStaff, requireOwner, requireSuperadminOrOwner } = require("../middleware/role");
const { checkRoomOwnership } = require("../middleware/ownership");
const {
  createRoom,
  bulkCreateRooms,
  getRoomsByHostel,
  getAllRooms,
  updateRoom,
  deleteRoom
} = require("../controllers/roomController");

// Create rooms in bulk
router.post("/bulk", protect, requireOwnerOrStaff, bulkCreateRooms);

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

