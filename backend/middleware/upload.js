'use strict';
/**
 * Multer + Cloudinary upload middleware
 *
 * Flow: browser → multer memoryStorage (no disk) → cloudinary → URL stored in DB
 * No temp files left on server. Safe for ephemeral filesystems (Render, Railway etc.)
 */
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Use memoryStorage — no disk writes at all ────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Only JPEG, PNG, and WebP images are allowed. Got: ${file.mimetype}`), false);
    }
};

const multerUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: FILE_SIZE_LIMIT, files: MAX_FILES }
});

// ── multer middleware (accepts up to 10 files under field "photos") ───────────
const uploadHostelPhotos = multerUpload.array('photos', MAX_FILES);

// ── Upload buffer to Cloudinary ───────────────────────────────────────────────
const uploadToCloudinary = (buffer, originalname) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'staynest-hostels',
                public_id: `${Date.now()}-${originalname.replace(/\s+/g, '_')}`,
                resource_type: 'image',
                transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });

// ── Helper used in hostelController ──────────────────────────────────────────
const uploadFilesToCloudinary = async (files) => {
    const urls = await Promise.all(
        files.map(f => uploadToCloudinary(f.buffer, f.originalname))
    );
    return urls;
};

// ── Delete from Cloudinary ──────────────────────────────────────────────────
const deleteFromCloudinary = async (url) => {
    try {
        if (!url) return;
        
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567/staynest-hostels/filename.jpg
        // Public ID: staynest-hostels/filename
        const parts = url.split('/');
        const folderIndex = parts.indexOf('staynest-hostels');
        if (folderIndex === -1) return;

        const publicIdWithExt = parts.slice(folderIndex).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove only the last file extension

        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

module.exports = { uploadHostelPhotos, uploadFilesToCloudinary, deleteFromCloudinary };
