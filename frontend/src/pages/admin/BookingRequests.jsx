// frontend/src/pages/admin/BookingRequests.jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './BookingRequests.css';

export default function BookingRequests() {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/bookings?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId) => {
        if (!confirm('Approve this booking?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.patch(`/bookings/${bookingId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBookings();
        } catch (error) {
            console.error('Error approving booking:', error);
            alert('Failed to approve booking');
        }
    };

    const handleReject = async (bookingId) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // User cancelled

        try {
            const token = localStorage.getItem('token');
            await api.patch(`/bookings/${bookingId}/reject`, { reason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBookings();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('Failed to reject booking');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-warning)';
            case 'approved': return 'var(--color-success)';
            case 'rejected': return 'var(--color-error)';
            case 'cancelled': return 'var(--color-text-tertiary)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout role="admin">
            <div className="booking-requests animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Booking Requests</h1>
                        <p className="text-secondary">Review and manage booking requests</p>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {['pending', 'approved', 'rejected', 'cancelled'].map(status => (
                        <button
                            key={status}
                            className={`filter-tab ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="bookings-list">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state card">
                        <h2>📋</h2>
                        <h3>No {filter} bookings</h3>
                        <p>There are no bookings with status: {filter}</p>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {bookings.map(booking => (
                            <div key={booking._id} className="booking-card card card-hover">
                                <div className="booking-header">
                                    <div className="booking-info">
                                        <h3>{booking.resident?.name || 'Unknown'}</h3>
                                        <p className="text-secondary">{booking.resident?.email}</p>
                                    </div>
                                    <span
                                        className="status-badge"
                                        style={{
                                            background: `${getStatusColor(booking.status)}20`,
                                            color: getStatusColor(booking.status),
                                            border: `1px solid ${getStatusColor(booking.status)}`
                                        }}
                                    >
                                        {booking.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="booking-details">
                                    <div className="detail-row">
                                        <span className="detail-label">🏨 Hostel:</span>
                                        <span>{booking.hostel?.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">🚪 Room:</span>
                                        <span>Room {booking.room?.roomNumber} ({booking.room?.type})</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">📅 Check-in:</span>
                                        <span>{formatDate(booking.checkIn)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">📅 Check-out:</span>
                                        <span>{formatDate(booking.checkOut)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">💰 Price:</span>
                                        <span>₹{booking.priceSnapshot}/month</span>
                                    </div>
                                    {booking.rejectionReason && (
                                        <div className="detail-row">
                                            <span className="detail-label">❌ Reason:</span>
                                            <span>{booking.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>

                                {booking.status === 'pending' && (
                                    <div className="booking-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleReject(booking._id)}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleApprove(booking._id)}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
