import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [hostelsRes, bookingsRes] = await Promise.all([
                api.get('/hostels'),
                api.get('/bookings')
            ]);

            // After interceptor: res.data is the unwrapped array
            const hostelsData = hostelsRes.data || [];
            const bookings = bookingsRes.data || [];

            setHostels(hostelsData);
            setStats({
                totalHostels: hostelsData.length,
                totalBookings: bookings.length,
                pendingBookings: bookings.filter(b => b.status === 'pending').length,
                approvedBookings: bookings.filter(b => b.status === 'approved').length
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="owner-dashboard">
            <div className="dashboard-header">
                <h1>🏨 Owner Dashboard</h1>
                <div className="header-actions">
                    <button onClick={() => navigate('/owner/hostels')} className="primary-btn">
                        Manage Hostels
                    </button>
                    <button onClick={() => navigate('/owner/staff')} className="secondary-btn">
                        Manage Staff
                    </button>
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🏨</div>
                        <div className="stat-content">
                            <h3>My Hostels</h3>
                            <p className="stat-value">{stats.totalHostels}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-content">
                            <h3>Total Bookings</h3>
                            <p className="stat-value">{stats.totalBookings}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <h3>Pending Approvals</h3>
                            <p className="stat-value">{stats.pendingBookings}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>Approved Bookings</h3>
                            <p className="stat-value">{stats.approvedBookings}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    <button onClick={() => navigate('/owner/hostels')} className="action-card">
                        <span className="action-icon">🏨</span>
                        <h3>Manage Hostels</h3>
                        <p>Create and manage your hostels</p>
                    </button>
                    <button onClick={() => navigate('/owner/rooms')} className="action-card">
                        <span className="action-icon">🛏️</span>
                        <h3>Manage Rooms</h3>
                        <p>Add and update room details</p>
                    </button>
                    <button onClick={() => navigate('/owner/bookings')} className="action-card">
                        <span className="action-icon">📋</span>
                        <h3>Booking Requests</h3>
                        <p>Approve or reject bookings</p>
                    </button>
                    <button onClick={() => navigate('/owner/staff')} className="action-card">
                        <span className="action-icon">👥</span>
                        <h3>Staff Management</h3>
                        <p>Create and manage staff accounts</p>
                    </button>
                </div>
            </div>

            <div className="hostels-section">
                <h2>My Hostels</h2>
                {hostels.length === 0 ? (
                    <div className="no-data">
                        <p>No hostels yet. Create your first hostel to get started!</p>
                        <button onClick={() => navigate('/owner/hostels')} className="primary-btn">
                            Create Hostel
                        </button>
                    </div>
                ) : (
                    <div className="hostels-grid">
                        {hostels.map((hostel) => (
                            <div key={hostel._id} className="hostel-card">
                                <h3>{hostel.name}</h3>
                                <p className="hostel-location">📍 {hostel.city}</p>
                                <p className="hostel-address">{hostel.address}</p>
                                <p className="hostel-rooms">Total Rooms: {hostel.totalRooms}</p>
                                <button
                                    onClick={() => navigate(`/owner/hostels/${hostel._id}`)}
                                    className="view-btn"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;
