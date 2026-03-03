require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES, OWNER_STATUS } = require('../config/constants');

/**
 * Seed script to create initial superadmin account
 * Run with: node utils/seedSuperadmin.js
 */

const seedSuperadmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if superadmin already exists
        const existing = await User.findOne({ role: ROLES.SUPERADMIN });

        if (existing) {
            console.log('⚠️  Superadmin already exists:');
            console.log(`   Email: ${existing.email}`);
            console.log(`   Name: ${existing.name}`);
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create superadmin
        const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

        const superadmin = await User.create({
            name: 'Platform Administrator',
            email: 'admin@hostelplatform.com',
            password: hashedPassword,
            role: ROLES.SUPERADMIN,
            ownerStatus: OWNER_STATUS.NONE, // Superadmin doesn't need owner status
            isActive: true
        });

        console.log('🎉 Superadmin created successfully!');
        console.log('');
        console.log('📧 Login Credentials:');
        console.log(`   Email: ${superadmin.email}`);
        console.log(`   Password: SuperAdmin@123`);
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        console.log('');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating superadmin:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedSuperadmin();
