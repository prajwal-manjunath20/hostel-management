import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import '../staff/MaintenanceRequests.css';

export default function MyAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).id;

            const res = await api.get(`/maintenance?assignedTo=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter out resolved and cancelled
            const activeAssignments = res.data.filter(
                r => r.status !== 'resolved' && r.status !== 'cancelled'
            );
            setAssignments(activeAssignments);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
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
            fetchAssignments();
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
                        <h1>My Assignments</h1>
                        <p className="text-secondary">Requests assigned to you</p>
                    </div>
                </header>

                {loading ? (
                    <div className="requests-grid">
                        {[1, 2].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="empty-state card">
                        <h2>✅</h2>
                        <h3>No Active Assignments</h3>
                        <p>You don't have any pending assignments</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {assignments.map(request => (
                            <div key={request._id} className="maintenance-card card">
                                <div className="card-header">
                                    <div className="title-row">
                                        <span className="category-icon">{getCategoryIcon(request.category)}</span>
                                        <h3>{request.title}</h3>
                                    </div>
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
                                </div>

                                <p className="description">{request.description}</p>

                                <div className="card-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Resident:</span>
                                        <span>{request.resident?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Contact:</span>
                                        <span>{request.resident?.email}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Location:</span>
                                        <span>{request.hostel?.name} - Room {request.room?.roomNumber}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Status:</span>
                                        <span className="status-text">{request.status}</span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-success btn-full"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowResolveModal(true);
                                        }}
                                    >
                                        Mark as Resolved
                                    </button>
                                </div>
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
