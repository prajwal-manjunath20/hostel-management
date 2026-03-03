// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalHostels: 0,
        totalRooms: 0,
        pendingBookings: 0,
        approvedBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [hostelsRes, bookingsRes] = await Promise.all([
                api.get('/hostels', config),
                api.get('/bookings', config)
            ]);

            // After interceptor: res.data is the unwrapped array
            const hostels = hostelsRes.data || [];
            const bookings = bookingsRes.data || [];

            // Sum totalRooms from each hostel's field — no N+1 fetch needed
            const totalRooms = hostels.reduce((sum, h) => sum + (h.totalRooms || 0), 0);

            setStats({
                totalHostels: hostels.length,
                totalRooms,
                pendingBookings: bookings.filter(b => b.status === 'pending').length,
                approvedBookings: bookings.filter(b => b.status === 'approved').length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };


    const StatCard = ({ title, value, icon, color, onClick }) => (
        <div
            className={`stat-card card card-hover card-glow ${onClick ? 'clickable' : ''}`}
            onClick={onClick}
            style={{ '--card-color': color }}
        >
            <div className="stat-icon" style={{ color }}>{icon}</div>
            <div className="stat-content">
                <h3 className="stat-value">{loading ? '...' : value}</h3>
                <p className="stat-title">{title}</p>
            </div>
        </div>
    );

    const QuickAction = ({ title, description, icon, onClick }) => (
        <button className="quick-action card card-hover" onClick={onClick}>
            <div className="action-icon">{icon}</div>
            <div className="action-content">
                <h4>{title}</h4>
                <p>{description}</p>
            </div>
        </button>
    );

    return (
        <DashboardLayout role="admin">
            <div className="admin-dashboard animate-fade-in">
                <header className="dashboard-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p className="text-secondary">Manage your hostel operations</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="Total Hostels"
                        value={stats.totalHostels}
                        icon="🏨"
                        color="var(--color-primary)"
                        onClick={() => navigate('/admin/hostels')}
                    />
                    <StatCard
                        title="Total Rooms"
                        value={stats.totalRooms}
                        icon="🛏️"
                        color="var(--color-secondary)"
                        onClick={() => navigate('/admin/rooms')}
                    />
                    <StatCard
                        title="Pending Bookings"
                        value={stats.pendingBookings}
                        icon="⏳"
                        color="var(--color-warning)"
                        onClick={() => navigate('/admin/bookings')}
                    />
                    <StatCard
                        title="Approved Bookings"
                        value={stats.approvedBookings}
                        icon="✅"
                        color="var(--color-success)"
                    />
                </div>

                {/* Quick Actions */}
                <section className="quick-actions-section">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <QuickAction
                            title="Create Hostel"
                            description="Add a new hostel to the system"
                            icon="➕"
                            onClick={() => navigate('/admin/hostels')}
                        />
                        <QuickAction
                            title="Add Rooms"
                            description="Add rooms to existing hostels"
                            icon="🚪"
                            onClick={() => navigate('/admin/rooms')}
                        />
                        <QuickAction
                            title="Review Bookings"
                            description="Approve or reject booking requests"
                            icon="📋"
                            onClick={() => navigate('/admin/bookings')}
                        />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
