import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(searchVal.trim() ? `/hostels?city=${encodeURIComponent(searchVal.trim())}` : '/hostels');
  };

  const handleLogout = () => { logout(); navigate('/'); setDropOpen(false); };

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled;
  const dashboardPath = user
    ? `/${user.role === 'superadmin' ? 'superadmin' : user.role}`
    : '/login';

  return (
    <header className={`navbar ${transparent ? 'navbar--transparent' : 'navbar--solid'} ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          StayNest
        </Link>

        {!isHome && (
          <form className="navbar__search" onSubmit={handleSearch}>
            <svg className="navbar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="navbar__search-input"
              placeholder="Search destinations..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </form>
        )}

        <nav className="navbar__right">
          <Link to="/hostels" className={`nav-link ${location.pathname === '/hostels' ? 'nav-link--active' : ''}`}>
            Explore
          </Link>

          {user ? (
            <div className="navbar__user" ref={dropRef}>
              <button className="navbar__user-btn" onClick={() => setDropOpen(o => !o)}>
                <div className="navbar__user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                <span className="navbar__user-name">{user.name?.split(' ')[0]}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
              </button>
              {dropOpen && (
                <div className="navbar__dropdown">
                  <Link to={dashboardPath} className="navbar__dropdown-item" onClick={() => setDropOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
                    Dashboard
                  </Link>
                  <Link to="/hostels" className="navbar__dropdown-item" onClick={() => setDropOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                    Browse Hostels
                  </Link>
                  <div className="navbar__dropdown-divider" />
                  <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="navbar__cta">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
