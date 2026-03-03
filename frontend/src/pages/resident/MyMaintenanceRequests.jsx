import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './MyMaintenanceRequests.css';

export default function MyMaintenanceRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/maintenance/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (requestId) => {
        if (!confirm('Cancel this maintenance request?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.patch(`/maintenance/${requestId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (error) {
            console.error('Error cancelling request:', error);
            alert('Failed to cancel request');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-warning)';
            case 'in-progress': return 'var(--color-primary)';
            case 'resolved': return 'var(--color-success)';
            case 'cancelled': return 'var(--color-text-tertiary)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'in-progress': return '🔧';
            case 'resolved': return '✓';
            case 'cancelled': return '🚫';
            default: return '📋';
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout role="resident">
            <div className="my-maintenance-requests animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>My Maintenance Requests</h1>
                        <p className="text-secondary">Track your maintenance requests</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/resident/maintenance/new')}>
                        + New Request
                    </button>
                </header>

                {loading ? (
                    <div className="timeline">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state card">
                        <h2>🔧</h2>
                        <h3>No Maintenance Requests</h3>
                        <p>You haven't submitted any maintenance requests yet</p>
                        <button className="btn btn-primary" onClick={() => navigate('/resident/maintenance/new')}>
                            Submit Request
                        </button>
                    </div>
                ) : (
                    <div className="timeline">
                        {requests.map(request => (
                            <div key={request._id} className="timeline-item">
                                <div className="timeline-marker" style={{ background: getStatusColor(request.status) }}>
                                    {getStatusIcon(request.status)}
                                </div>
                                <div className="timeline-content card">
                                    <div className="request-header">
                                        <div className="title-section">
                                            <span className="category-icon">{getCategoryIcon(request.category)}</span>
                                            <div>
                                                <h3>{request.title}</h3>
                                                <p className="text-secondary">{request.hostel?.name} - Room {request.room?.roomNumber}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: `${getStatusColor(request.status)}20`,
                                                color: getStatusColor(request.status),
                                                border: `1px solid ${getStatusColor(request.status)}`
                                            }}
                                        >
                                            {request.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <p className="description">{request.description}</p>

                                    <div className="request-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Category:</span>
                                            <span className="detail-value">{request.category}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Priority:</span>
                                            <span className="detail-value">{request.priority}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Submitted:</span>
                                            <span className="detail-value">{formatDate(request.createdAt)}</span>
                                        </div>
                                        {request.assignedTo && (
                                            <div className="detail-row">
                                                <span className="detail-label">Assigned to:</span>
                                                <span className="detail-value">{request.assignedTo.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {request.resolutionNotes && (
                                        <div className="resolution-notes">
                                            <strong>Resolution:</strong> {request.resolutionNotes}
                                            {request.resolvedAt && (
                                                <div className="resolved-date">
                                                    Resolved on {formatDate(request.resolvedAt)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {request.status === 'pending' && (
                                        <button
                                            className="btn btn-secondary btn-full"
                                            onClick={() => handleCancel(request._id)}
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
