import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './DashboardLayout.css';

/* ── Nav config per role ────────────────────────────────────── */
const NAV = {
    superadmin: [
        { path: '/superadmin', label: 'Dashboard', icon: '◈' },
        { path: '/superadmin/analytics', label: 'Analytics', icon: '◉' },
    ],
    owner: [
        { path: '/owner', label: 'Dashboard', icon: '◈' },
        { path: '/owner/hostels', label: 'Hostels', icon: '⌂' },
        { path: '/owner/rooms', label: 'Rooms', icon: '⊡' },
        { path: '/owner/bookings', label: 'Bookings', icon: '⊞' },
        { path: '/owner/billing', label: 'Billing', icon: '◎' },
        { path: '/owner/staff', label: 'Staff', icon: '⊙' },
        { path: '/owner/listings', label: 'My Listings', icon: '◫' },
    ],
    admin: [
        { path: '/admin', label: 'Dashboard', icon: '◈' },
        { path: '/admin/hostels', label: 'Hostels', icon: '⌂' },
        { path: '/admin/rooms', label: 'Rooms', icon: '⊡' },
        { path: '/admin/bookings', label: 'Bookings', icon: '⊞' },
        { path: '/admin/billing', label: 'Billing', icon: '◎' },
    ],
    resident: [
        { path: '/resident', label: 'Dashboard', icon: '◈' },
        { path: '/resident/browse', label: 'Browse Hostels', icon: '⌂' },
        { path: '/resident/bookings', label: 'My Bookings', icon: '⊞' },
        { path: '/resident/maintenance/new', label: 'New Request', icon: '⊕' },
        { path: '/resident/maintenance/my', label: 'My Requests', icon: '⊡' },
        { path: '/resident/bills', label: 'My Bills', icon: '◎' },
        { path: '/resident/apply-owner', label: 'Become Owner', icon: '◫' },
    ],
    staff: [
        { path: '/staff', label: 'Dashboard', icon: '◈' },
        { path: '/staff/requests', label: 'All Requests', icon: '⊞' },
        { path: '/staff/my-assignments', label: 'My Tasks', icon: '⊡' },
    ],
};

const ROLE_LABEL = {
    superadmin: 'Super Admin',
    owner: 'Owner',
    admin: 'Admin',
    resident: 'Resident',
    staff: 'Staff',
};

/**
 * DashboardLayout — replaces the old Layout.jsx.
 * Props: role (string), pageTitle (string)
 */
export default function DashboardLayout({ children, role, pageTitle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [resending, setResending] = useState(false);

    const navItems = NAV[role] || NAV[user?.role] || [];
    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const currentPage = navItems.find(i => location.pathname === i.path)?.label
        || pageTitle
        || 'Dashboard';

    const handleLogout = () => { logout(); navigate('/login'); };

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
        <div className="dash-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 450 }}
                />
            )}

            {/* Sidebar */}
            <aside className={`dash-sidebar${sidebarOpen ? ' dash-sidebar--open' : ''}`}>
                <Link to="/" className="dash-sidebar__brand" onClick={() => setSidebarOpen(false)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--color-primary)">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <span className="dash-sidebar__logo-text">StayNest</span>
                </Link>

                <div className="dash-sidebar__role">{ROLE_LABEL[role] || role}</div>

                <nav className="dash-sidebar__nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                            className={`dash-nav-item${location.pathname === item.path ? ' dash-nav-item--active' : ''}`}
                        >
                            <span className="dash-nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="dash-sidebar__footer">
                    <button className="dash-logout" onClick={handleLogout}>
                        <span className="dash-nav-icon">→</span>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="dash-main">
                {/* Topbar */}
                <header className="dash-topbar">
                    <div className="dash-topbar__breadcrumb">
                        StayNest &rsaquo; <span>{currentPage}</span>
                    </div>
                    <div className="dash-topbar__right">
                        <button className="dash-user-pill" onClick={() => { }}>
                            <div className="dash-avatar">{initials}</div>
                            <span className="dash-user-name">{user?.name || 'User'}</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="dash-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
