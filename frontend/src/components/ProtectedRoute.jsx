// frontend/src/components/ProtectedRoute.jsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  if (!user.isEmailVerified) {
    const handleResend = async () => {
      setResending(true);
      try {
        await api.post('/auth/resend-verification');
        alert('Verification email sent! Please check your inbox.');
      } catch (err) {
        alert(err.response?.data?.error?.message || 'Failed to resend email.');
      } finally {
        setResending(false);
      }
    };

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxWidth: '400px',
            width: '100%'
        }}>
            <h1 style={{ fontSize: '3.5rem', margin: '0 0 16px 0' }}>✉️</h1>
            <h2 style={{ margin: '0 0 12px 0', color: '#333' }}>Verify your email</h2>
            <p style={{ color: '#666', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              We've sent a verification link to <strong>{user.email}</strong>. 
              Please check your inbox and click the link to access your account.
            </p>
            
            <button 
                onClick={handleResend} 
                disabled={resending}
                style={{
                    background: '#FF5A5F',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: resending ? 'default' : 'pointer',
                    opacity: resending ? 0.7 : 1,
                    width: '100%',
                    marginBottom: '12px',
                    transition: 'opacity 0.2s'
                }}
            >
                {resending ? 'Sending...' : 'Resend Email'}
            </button>

            <button 
                onClick={() => { logout(); }}
                style={{
                    background: 'transparent',
                    color: '#666',
                    border: 'none',
                    padding: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }}
            >
                Sign out
            </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</h1>
        <h2 style={{ marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
}
