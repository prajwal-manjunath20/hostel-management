// frontend/src/pages/resident/MyBookings.jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './MyBookings.css';

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/bookings/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!confirm('Cancel this booking?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.patch(`/bookings/${bookingId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBookings();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.error?.message || 'Failed to cancel booking');
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'approved': return '✅';
            case 'rejected': return '❌';
            case 'cancelled': return '🚫';
            default: return '📋';
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
        <DashboardLayout role="resident">
            <div className="my-bookings animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>My Bookings</h1>
                        <p className="text-secondary">Track your booking history and status</p>
                    </div>
                </header>

                {loading ? (
                    <div className="bookings-timeline">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state card">
                        <h2>📋</h2>
                        <h3>No Bookings Yet</h3>
                        <p>You haven't made any booking requests</p>
                    </div>
                ) : (
                    <div className="bookings-timeline">
                        {bookings.map((booking, index) => (
                            <div key={booking._id} className="timeline-item">
                                <div className="timeline-marker" style={{ background: getStatusColor(booking.status) }}>
                                    {getStatusIcon(booking.status)}
                                </div>
                                <div className="timeline-content card card-hover">
                                    <div className="booking-header">
                                        <div>
                                            <h3>{booking.hostel?.name}</h3>
                                            <p className="text-secondary">Room {booking.room?.roomNumber}</p>
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

                                    <div className="booking-details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Check-in</span>
                                            <span className="detail-value">{formatDate(booking.checkIn)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Check-out</span>
                                            <span className="detail-value">{formatDate(booking.checkOut)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Price</span>
                                            <span className="detail-value">₹{booking.priceSnapshot}/mo</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Requested</span>
                                            <span className="detail-value">{formatDate(booking.createdAt)}</span>
                                        </div>
                                    </div>

                                    {booking.rejectionReason && (
                                        <div className="rejection-reason">
                                            <strong>Rejection Reason:</strong> {booking.rejectionReason}
                                        </div>
                                    )}

                                    {booking.status === 'pending' && (
                                        <button
                                            className="btn btn-secondary btn-full"
                                            onClick={() => handleCancel(booking._id)}
                                        >
                                            Cancel Booking
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
