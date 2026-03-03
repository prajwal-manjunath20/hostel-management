// tools/simulate-concurrent-bookings.js
// Run: node tools/simulate-concurrent-bookings.js
//
// Prerequisites:
//   1. Backend running on localhost:5000
//   2. Set TOKEN below (copy from browser DevTools → LocalStorage → "token")
//   3. Set ROOM_ID + HOSTEL_ID to real IDs from your DB
//
// Expected result:
//   One request → 201 Created
//   Other request → 409 (ROOM_ALREADY_BOOKED or ACTIVE_BOOKING_EXISTS)
//
// If BOTH return 201 → transaction not working (check replica set config).

const https = require('https');
const http = require('http');

// ─── CONFIG — fill these in before running ───────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const TOKEN = process.env.TOKEN || 'paste-your-jwt-here';
const ROOM_ID = process.env.ROOM_ID || 'REPLACE_WITH_REAL_ROOM_ID';
const HOSTEL_ID = process.env.HOSTEL_ID || 'REPLACE_WITH_REAL_HOSTEL_ID';

const PAYLOAD = {
    roomId: ROOM_ID,
    hostelId: HOSTEL_ID,
    checkIn: '2027-06-10',
    checkOut: '2027-06-20',
};
// ─────────────────────────────────────────────────────────────────────────────

function postBooking(label) {
    return new Promise((resolve) => {
        const body = JSON.stringify(PAYLOAD);
        const url = new URL(`${API_BASE}/bookings`);
        const lib = url.protocol === 'https:' ? https : http;

        const req = lib.request(
            {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'Authorization': `Bearer ${TOKEN}`,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    let parsed;
                    try { parsed = JSON.parse(data); } catch { parsed = data; }
                    console.log(`\n[${label}] Status: ${res.statusCode}`);
                    console.log(`[${label}] Body:`, JSON.stringify(parsed, null, 2));
                    resolve({ status: res.statusCode, body: parsed });
                });
            }
        );

        req.on('error', (err) => {
            console.error(`[${label}] Network error:`, err.message);
            resolve({ status: 0, error: err.message });
        });

        req.write(body);
        req.end();
    });
}

(async () => {
    console.log('🚀 Firing two simultaneous booking requests...\n');

    // Fire both at exactly the same time
    const [r1, r2] = await Promise.all([
        postBooking('Request-1'),
        postBooking('Request-2'),
    ]);

    const statuses = [r1.status, r2.status];
    const successes = statuses.filter(s => s === 201).length;
    const conflicts = statuses.filter(s => s === 409 || s === 400).length;

    console.log('\n──────────── RESULT ────────────');
    if (successes === 1 && conflicts === 1) {
        console.log('✅ PASS — exactly one booking created, one conflict returned.');
        console.log('   Atomic overlap protection is working correctly.');
    } else if (successes === 2) {
        console.log('❌ FAIL — BOTH requests succeeded!');
        console.log('   Overlap/transaction logic is not working.');
        console.log('   Check: Is your MongoDB a replica set? Transactions require replica sets.');
    } else {
        console.log('⚠️  Unexpected result — check the response bodies above.');
        console.log(`   Statuses: ${statuses}`);
    }
    console.log('────────────────────────────────\n');
})();
