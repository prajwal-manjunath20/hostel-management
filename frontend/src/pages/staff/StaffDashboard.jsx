import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        resolved: 0,
        myAssignments: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).id;

            // Fetch all requests
            const res = await api.get('/maintenance', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const requests = res.data;

            // Calculate stats
            setStats({
                pending: requests.filter(r => r.status === 'pending').length,
                inProgress: requests.filter(r => r.status === 'in-progress').length,
                resolved: requests.filter(r => r.status === 'resolved').length,
                myAssignments: requests.filter(r => r.assignedTo?._id === userId && r.status !== 'resolved').length
            });

            // Get recent requests (last 5)
            setRecentRequests(requests.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'var(--color-error)';
            case 'high': return 'var(--color-warning)';
            case 'medium': return 'var(--color-primary)';
            case 'low': return 'var(--color-text-secondary)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'plumbing': return '🚰';
            case 'electrical': return '⚡';
            case 'furniture': return '🪑';
            case 'cleaning': return '🧹';
            default: return '🔧';
        }
    };

    return (
        <DashboardLayout role="staff">
            <div className="staff-dashboard animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Staff Dashboard</h1>
                        <p className="text-secondary">Manage maintenance requests and assignments</p>
                    </div>
                </header>

                {loading ? (
                    <div className="stats-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card card card-hover" onClick={() => navigate('/staff/requests?status=pending')}>
                                <div className="stat-icon" style={{ background: 'var(--color-warning)' }}>⏳</div>
                                <div className="stat-content">
                                    <h3>{stats.pending}</h3>
                                    <p>Pending Requests</p>
                                </div>
                            </div>

                            <div className="stat-card card card-hover" onClick={() => navigate('/staff/requests?status=in-progress')}>
                                <div className="stat-icon" style={{ background: 'var(--color-primary)' }}>🔧</div>
                                <div className="stat-content">
                                    <h3>{stats.inProgress}</h3>
                                    <p>In Progress</p>
                                </div>
                            </div>

                            <div className="stat-card card card-hover" onClick={() => navigate('/staff/requests?status=resolved')}>
                                <div className="stat-icon" style={{ background: 'var(--color-success)' }}>✓</div>
                                <div className="stat-content">
                                    <h3>{stats.resolved}</h3>
                                    <p>Resolved</p>
                                </div>
                            </div>

                            <div className="stat-card card card-hover" onClick={() => navigate('/staff/my-assignments')}>
                                <div className="stat-icon" style={{ background: 'var(--color-secondary)' }}>👤</div>
                                <div className="stat-content">
                                    <h3>{stats.myAssignments}</h3>
                                    <p>My Assignments</p>
                                </div>
                            </div>
                        </div>

                        <div className="recent-section">
                            <div className="section-header">
                                <h2>Recent Requests</h2>
                                <button className="btn btn-secondary" onClick={() => navigate('/staff/requests')}>
                                    View All
                                </button>
                            </div>

                            {recentRequests.length === 0 ? (
                                <div className="empty-state card">
                                    <h2>📋</h2>
                                    <h3>No Requests Yet</h3>
                                    <p>Maintenance requests will appear here</p>
                                </div>
                            ) : (
                                <div className="requests-list">
                                    {recentRequests.map(request => (
                                        <div key={request._id} className="request-card card card-hover" onClick={() => navigate('/staff/requests')}>
                                            <div className="request-header">
                                                <div className="request-title">
                                                    <span className="category-icon">{getCategoryIcon(request.category)}</span>
                                                    <h3>{request.title}</h3>
                                                </div>
                                                <span
                                                    className="priority-badge"
                                                    style={{
                                                        background: `${getPriorityColor(request.priority)}20`,
                                                        color: getPriorityColor(request.priority),
                                                        border: `1px solid ${getPriorityColor(request.priority)}`
                                                    }}
                                                >
                                                    {request.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="request-description">{request.description}</p>
                                            <div className="request-meta">
                                                <span>🏨 {request.hostel?.name}</span>
                                                <span>🚪 Room {request.room?.roomNumber}</span>
                                                <span>👤 {request.resident?.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
