'use strict';

const mongoose = require('mongoose');

/**
 * Counter schema — used for atomic sequential ID generation.
 * MongoDB $inc is atomic, so concurrent callers always get a unique next value.
 *
 * Naming convention for invoice counters:  `invoice_<ownerId>`
 */
const CounterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

/**
 * Get next sequence value atomically.
 * @param {string} name - Counter name (e.g. "invoice_<ownerId>")
 * @returns {Promise<number>} Next sequence number (1-based)
 */
CounterSchema.statics.nextSeq = async function (name) {
    const doc = await this.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return doc.seq;
};

module.exports = mongoose.model('Counter', CounterSchema);
