import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            return setError('Passwords do not match');
        }
        if (form.password.length < 8) {
            return setError('Password must be at least 8 characters');
        }
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!strongRegex.test(form.password)) {
            return setError('Password must include uppercase, lowercase, number, and special character');
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password/${token}`, {
                password: form.password
            });
            navigate('/login', { state: { message: 'Password reset successful! Please login with your new password.' } });
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card card card-glow">
                <div className="auth-header">
                    <h1>🏨 Hostel MS</h1>
                    <h2>Set New Password</h2>
                    <p className="text-secondary">Create a strong password for your account</p>
                </div>

                <form onSubmit={onSubmit} className="auth-form">
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input"
                            value={form.password}
                            onChange={onChange}
                            required
                            placeholder="Min 8 chars, upper/lower/number/special"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="input"
                            value={form.confirmPassword}
                            onChange={onChange}
                            required
                            placeholder="Repeat your new password"
                        />
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Updating...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        <Link to="/login" className="auth-link">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
