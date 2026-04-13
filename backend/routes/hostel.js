const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { requireOwner, requireSuperadminOrOwner } = require("../middleware/role");
const { checkHostelOwnership } = require("../middleware/ownership");
const { uploadHostelPhotos } = require('../middleware/upload');
const {
  createHostel,
  getAllHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
  uploadPhotos,
  deletePhoto,
  togglePublish
} = require("../controllers/hostelController");

// Create hostel (approved owners only)
router.post("/", protect, requireOwner, createHostel);

// Get all hostels (filtered by ownership)
router.get("/", protect, getAllHostels);

// Get single hostel
router.get("/:id", protect, getHostelById);

// Update hostel (owner or superadmin)
router.patch("/:id", protect, requireSuperadminOrOwner, checkHostelOwnership, updateHostel);

// Upload photos to hostel
router.post("/:id/photos", protect, requireOwner, checkHostelOwnership, uploadHostelPhotos, uploadPhotos);

// Delete photo from hostel
router.delete("/:id/photos", protect, requireOwner, checkHostelOwnership, deletePhoto);

// Publish / unpublish hostel on marketplace
router.patch("/:id/publish", protect, requireOwner, checkHostelOwnership, togglePublish);

// Delete hostel (owner or superadmin)
router.delete("/:id", protect, requireSuperadminOrOwner, checkHostelOwnership, deleteHostel);

module.exports = router;

