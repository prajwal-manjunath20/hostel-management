import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await axios.post(`${API_URL}/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(res.data.message);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error?.message || 'Verification failed. The link may have expired.');
            }
        };
        verify();
    }, [token]);

    const handleResend = async () => {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            alert('Please login first to resend verification email.');
            return;
        }
        try {
            await axios.post(
                `${API_URL}/auth/resend-verification`,
                {},
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            alert('Verification email sent! Please check your inbox.');
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to resend email.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card card card-glow">
                <div className="auth-header">
                    <h1>🏨 Hostel MS</h1>
                    <h2>Email Verification</h2>
                </div>

                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                    {status === 'verifying' && (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                            <p style={{ color: '#888' }}>Verifying your email...</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                            <p style={{ color: '#4caf50', fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>Email Verified!</p>
                            <p style={{ color: '#888', fontSize: '14px' }}>{message}</p>
                            <Link to="/login" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-block', padding: '12px 32px' }}>
                                Go to Login
                            </Link>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
                            <p style={{ color: '#f44336', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Verification Failed</p>
                            <p style={{ color: '#888', fontSize: '14px' }}>{message}</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                                <button onClick={handleResend} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                                    Resend Email
                                </button>
                                <Link to="/login" className="btn" style={{ padding: '12px 24px', background: '#333', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
