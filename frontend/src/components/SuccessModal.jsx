import { motion, AnimatePresence } from 'framer-motion';
import './SuccessModal.css';

/**
 * Animated success modal with Framer Motion scale+fade.
 *
 * Props:
 *   show     — boolean to control visibility
 *   title    — heading text (default "Booking Confirmed!")
 *   message  — body text
 *   onClose  — callback when button is clicked
 *   ctaLabel — button label (default "Continue")
 */
export default function SuccessModal({
    show,
    title = 'Booking Confirmed!',
    message = 'Your reservation is all set. Check your email for details.',
    onClose,
    ctaLabel = 'Continue',
}) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="success-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="success-card"
                        initial={{ scale: 0.78, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Animated tick circle */}
                        <div className="success-icon">
                            <svg viewBox="0 0 52 52" fill="none">
                                <circle cx="26" cy="26" r="25" stroke="#FF5A5F" strokeWidth="2" />
                                <path
                                    d="M14 27l8 8 16-16"
                                    stroke="#FF5A5F"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="success-check"
                                />
                            </svg>
                        </div>

                        <h2 className="success-title">{title}</h2>
                        <p className="success-msg">{message}</p>

                        <button className="success-btn" onClick={onClose}>
                            {ctaLabel}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
