// frontend/src/components/Layout.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout({ children, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = {
    admin: [
      { path: '/admin', label: 'Dashboard', icon: '📊' },
      { path: '/admin/hostels', label: '🏨 Hostels', icon: '🏨' },
      { path: '/admin/rooms', label: '🚪 Rooms', icon: '🚪' },
      { path: '/admin/bookings', label: '📋 Bookings', icon: '📋' },
      { path: '/admin/billing', label: '💰 Billing', icon: '💰' }
    ],
    resident: [
      { path: '/resident', label: 'Dashboard', icon: '🏠' },
      { path: '/resident/browse', label: '🔍 Browse Hostels', icon: '🔍' },
      { path: '/resident/bookings', label: '📋 My Bookings', icon: '📋' },
      { path: '/resident/maintenance/new', label: '🔧 New Request', icon: '🔧' },
      { path: '/resident/maintenance/my', label: '📝 My Requests', icon: '📝' },
      { path: '/resident/bills', label: '💰 My Bills', icon: '💰' }
    ],
    staff: [
      { path: '/staff', label: 'Dashboard', icon: '📊' },
      { path: '/staff/requests', label: 'All Requests', icon: '🔧' },
      { path: '/staff/my-assignments', label: 'My Assignments', icon: '📝' }
    ]
  };

  const navItems = menuItems[role] || [];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <h2 className="logo">🏨 Hostel MS</h2>
          <p className="role-badge">{role.toUpperCase()}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="nav-item"
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={logout} className="logout-btn">
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
