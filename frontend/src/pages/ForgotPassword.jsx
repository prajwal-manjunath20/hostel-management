import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setLoading(true);

        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setStatus('If an account with that email exists, a password reset link has been sent. Check your inbox (and spam folder).');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card card card-glow">
                <div className="auth-header">
                    <h1>🏨 Hostel MS</h1>
                    <h2>Reset Password</h2>
                    <p className="text-secondary">Enter your email to receive a reset link</p>
                </div>

                {status ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                        <p style={{ color: '#4caf50', fontWeight: 600, marginBottom: '8px' }}>Email Sent!</p>
                        <p style={{ color: '#888', fontSize: '14px' }}>{status}</p>
                        <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '20px', display: 'inline-block' }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your account email"
                            />
                        </div>

                        {error && <div className="error-message">⚠️ {error}</div>}

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login" className="auth-link">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
