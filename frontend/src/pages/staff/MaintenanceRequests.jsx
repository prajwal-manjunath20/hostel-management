import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './MaintenanceRequests.css';

export default function MaintenanceRequests() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const statusFilter = searchParams.get('status') || 'all';

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [requests, statusFilter]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/maintenance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        if (statusFilter === 'all') {
            setFilteredRequests(requests);
        } else {
            setFilteredRequests(requests.filter(r => r.status === statusFilter));
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await api.patch(`/maintenance/${requestId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleSelfAssign = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).id;

            await api.patch(`/maintenance/${requestId}/assign`,
                { staffId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchRequests();
        } catch (error) {
            console.error('Error assigning request:', error);
            alert('Failed to assign request');
        }
    };

    const handleResolve = async () => {
        if (!resolutionNotes.trim()) {
            alert('Please enter resolution notes');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await api.patch(`/maintenance/${selectedRequest._id}/resolve`,
                { resolutionNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowResolveModal(false);
            setResolutionNotes('');
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('Error resolving request:', error);
            alert('Failed to resolve request');
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-warning)';
            case 'in-progress': return 'var(--color-primary)';
            case 'resolved': return 'var(--color-success)';
            case 'cancelled': return 'var(--color-text-tertiary)';
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
            <div className="maintenance-requests animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Maintenance Requests</h1>
                        <p className="text-secondary">Manage and track all maintenance requests</p>
                    </div>
                </header>

                <div className="filter-tabs">
                    {['all', 'pending', 'in-progress', 'resolved', 'cancelled'].map(status => (
                        <button
                            key={status}
                            className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => setSearchParams({ status })}
                        >
                            {status.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="requests-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="empty-state card">
                        <h2>📋</h2>
                        <h3>No Requests Found</h3>
                        <p>No maintenance requests match the selected filter</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {filteredRequests.map(request => (
                            <div key={request._id} className="maintenance-card card">
                                <div className="card-header">
                                    <div className="title-row">
                                        <span className="category-icon">{getCategoryIcon(request.category)}</span>
                                        <h3>{request.title}</h3>
                                    </div>
                                    <div className="badges">
                                        <span
                                            className="badge priority-badge"
                                            style={{
                                                background: `${getPriorityColor(request.priority)}20`,
                                                color: getPriorityColor(request.priority),
                                                border: `1px solid ${getPriorityColor(request.priority)}`
                                            }}
                                        >
                                            {request.priority}
                                        </span>
                                        <span
                                            className="badge status-badge"
                                            style={{
                                                background: `${getStatusColor(request.status)}20`,
                                                color: getStatusColor(request.status),
                                                border: `1px solid ${getStatusColor(request.status)}`
                                            }}
                                        >
                                            {request.status}
                                        </span>
                                    </div>
                                </div>

                                <p className="description">{request.description}</p>

                                <div className="card-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Resident:</span>
                                        <span>{request.resident?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Location:</span>
                                        <span>{request.hostel?.name} - Room {request.room?.roomNumber}</span>
                                    </div>
                                    {request.assignedTo && (
                                        <div className="meta-item">
                                            <span className="meta-label">Assigned to:</span>
                                            <span>{request.assignedTo.name}</span>
                                        </div>
                                    )}
                                </div>

                                {request.status !== 'resolved' && request.status !== 'cancelled' && (
                                    <div className="card-actions">
                                        {!request.assignedTo && (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleSelfAssign(request._id)}
                                            >
                                                Assign to Me
                                            </button>
                                        )}

                                        {request.status === 'pending' && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleStatusChange(request._id, 'in-progress')}
                                            >
                                                Start Work
                                            </button>
                                        )}

                                        {request.status === 'in-progress' && (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowResolveModal(true);
                                                }}
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                )}

                                {request.resolutionNotes && (
                                    <div className="resolution-notes">
                                        <strong>Resolution:</strong> {request.resolutionNotes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {showResolveModal && (
                    <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
                        <div className="modal-content card" onClick={e => e.stopPropagation()}>
                            <h2>Resolve Request</h2>
                            <p className="text-secondary">Add notes about how this issue was resolved</p>

                            <textarea
                                className="input"
                                rows="4"
                                placeholder="Enter resolution notes..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                            />

                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-success" onClick={handleResolve}>
                                    Mark as Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
