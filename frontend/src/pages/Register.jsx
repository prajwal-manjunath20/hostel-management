// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './auth.css';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
            const role = await login(form.email, form.password);
            navigate(`/${role}`);
        } catch (err) {
            const d = err.response?.data;
            setError(
                (typeof d?.error === 'string' ? d.error : null) ||
                d?.error?.message || d?.message || 'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-brand">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF5A5F">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <span>StayNest</span>
                </div>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join thousands of travellers on StayNest</p>

                {error && (
                    <div className="auth-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>Full name</label>
                        <input type="text" name="name" value={form.name} onChange={onChange} placeholder="Your name" required autoFocus />
                    </div>

                    <div className="auth-field">
                        <label>Email address</label>
                        <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={onChange}
                            placeholder="Min 8 chars with uppercase & symbol"
                            required
                            minLength={8}
                        />
                        <span className="auth-field-hint">Uppercase, lowercase, number, and special character</span>
                    </div>

                    <div className="auth-field">
                        <label>Phone <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                        <input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <><span className="auth-spinner" /> Creating account...</>
                        ) : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-footer__link">Sign in</Link>
                </p>

                <p className="auth-footer" style={{ fontSize: 12, marginTop: 12 }}>
                    Want to list your hostel?{' '}
                    <span style={{ color: '#888' }}>Register as a resident first, then apply for ownership from your dashboard.</span>
                </p>
            </div>
        </div>
    );
}
