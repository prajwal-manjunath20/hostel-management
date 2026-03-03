/**
 * Index Verification Script
 * Run once before production deploy to confirm all Mongoose indexes exist in the DB.
 * Usage: node utils/verifyIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Import all models so their indexes are registered
require('../models/Hostel');
require('../models/Room');
require('../models/Booking');
require('../models/Bill');
require('../models/User');
require('../models/MaintenanceRequest');
require('../models/AuditLog');

const COLLECTIONS = ['hostels', 'rooms', 'bookings', 'bills', 'users', 'maintenancerequests'];

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        for (const col of COLLECTIONS) {
            const collection = mongoose.connection.collection(col);
            let indexes;
            try {
                indexes = await collection.indexes();
            } catch {
                console.log(`⚠️  Collection '${col}' does not exist yet (will be created on first write)\n`);
                continue;
            }
            console.log(`📋 ${col} (${indexes.length} indexes):`);
            indexes.forEach(idx => {
                const keys = JSON.stringify(idx.key);
                const opts = [];
                if (idx.unique) opts.push('unique');
                if (idx.sparse) opts.push('sparse');
                console.log(`   ${idx.name}: ${keys}${opts.length ? ' [' + opts.join(', ') + ']' : ''}`);
            });
            console.log('');
        }

        console.log('✅ Index verification complete.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

verify();
