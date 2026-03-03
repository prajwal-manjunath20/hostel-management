// tools/seed-superadmin.js
// Run ONCE: node tools/seed-superadmin.js
// Creates the platform superadmin account if it doesn't already exist.

// Load .env from the backend root (one level up from /tools)
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
// Fallback: also try cwd-relative (works when run as: node tools/seed-superadmin.js from backend/)
if (!process.env.MONGODB_URI) require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@hostelplatform.com';
    const existing = await User.findOne({ email });

    if (existing) {
        console.log(`✅ Superadmin already exists: ${email} (role: ${existing.role})`);
        await mongoose.disconnect();
        return;
    }

    const password = await bcrypt.hash('SuperAdmin@123', 12);
    await User.create({
        name: 'Platform Admin',
        email,
        password,
        role: 'superadmin',
        isEmailVerified: true,
        accountStatus: 'active'
    });

    console.log(`✅ Superadmin created: ${email}`);
    console.log('   Password: SuperAdmin@123');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
