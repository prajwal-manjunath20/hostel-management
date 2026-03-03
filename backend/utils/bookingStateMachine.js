'use strict';

/**
 * Booking state machine — domain logic lives here, not in controllers.
 *
 * Allowed transitions:
 *   pending  → approved, rejected, cancelled
 *   approved → cancelled
 *   rejected → (none)
 *   cancelled → (none)
 */
const TRANSITIONS = {
    pending: ['approved', 'rejected', 'cancelled'],
    approved: ['cancelled'],
    rejected: [],
    cancelled: []
};

/**
 * Check whether a status transition is permitted.
 * @param {string} from - Current booking status
 * @param {string} to   - Target status
 * @returns {boolean}
 */
function canTransition(from, to) {
    const allowed = TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
}

/**
 * Assert that a transition is valid, throwing a structured error if not.
 * Controllers call this before any DB update.
 * @param {string} from
 * @param {string} to
 * @throws {{ code: string, message: string, status: number }}
 */
function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        const err = new Error(`Transition '${from}' → '${to}' is not allowed`);
        err.code = 'INVALID_STATUS_TRANSITION';
        err.status = 409;
        throw err;
    }
}

module.exports = { TRANSITIONS, canTransition, assertTransition };
