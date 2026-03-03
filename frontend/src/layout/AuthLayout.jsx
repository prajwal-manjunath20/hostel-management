import { Link } from 'react-router-dom';
import './AuthLayout.css';

const FEATURES = [
    'Vetted hostels across India',
    'Transparent pricing, no surprises',
    'Book in minutes, cancel for free',
    'Dedicated support 24/7',
];

/**
 * AuthLayout — wraps Login, Register, ForgotPassword, ResetPassword, VerifyEmail.
 * No Navbar. Left: brand panel. Right: form.
 */
export default function AuthLayout({ children }) {
    return (
        <div className="auth-layout">
            {/* Left — Brand panel */}
            <div className="auth-panel">
                <Link to="/" className="auth-panel__logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <span className="auth-panel__logo-text">StayNest</span>
                </Link>

                <p className="auth-panel__tagline">
                    Find warm, welcoming hostels across India — handpicked for comfort, community, and value.
                </p>

                <ul className="auth-panel__features">
                    {FEATURES.map(f => (
                        <li key={f} className="auth-panel__feat">
                            <span className="auth-feat-dot" />
                            {f}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right — Form */}
            <div className="auth-form-panel">
                <div className="auth-form-panel__inner">
                    {children}
                </div>
            </div>
        </div>
    );
}
