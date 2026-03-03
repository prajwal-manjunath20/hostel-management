// frontend/src/pages/resident/ResidentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './ResidentDashboard.css';

export default function ResidentDashboard() {
    const navigate = useNavigate();
    const [myBookings, setMyBookings] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [bookingsRes, hostelsRes] = await Promise.all([
                api.get('/bookings/my', config),
                api.get('/hostels', config)
            ]);

            setMyBookings(bookingsRes.data || []);
            setHostels((hostelsRes.data || []).slice(0, 3)); // Show only 3 hostels
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentBooking = myBookings.find(b => b.status === 'approved');
    const pendingBooking = myBookings.find(b => b.status === 'pending');

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-warning)';
            case 'approved': return 'var(--color-success)';
            case 'rejected': return 'var(--color-error)';
            default: return 'var(--color-text-tertiary)';
        }
    };

    return (
        <DashboardLayout role="resident">
            <div className="resident-dashboard animate-fade-in">
                <header className="dashboard-header">
                    <div>
                        <h1>Welcome Back!</h1>
                        <p className="text-secondary">Manage your hostel bookings</p>
                    </div>
                </header>

                {/* Current Booking Status */}
                {currentBooking && (
                    <div className="current-booking card card-glow">
                        <div className="booking-badge">✓ Active Booking</div>
                        <h2>{currentBooking.hostel?.name}</h2>
                        <div className="booking-info-grid">
                            <div className="info-item">
                                <span className="info-label">Room</span>
                                <span className="info-value">{currentBooking.room?.roomNumber}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Check-in</span>
                                <span className="info-value">
                                    {new Date(currentBooking.checkIn).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Check-out</span>
                                <span className="info-value">
                                    {new Date(currentBooking.checkOut).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Price</span>
                                <span className="info-value">₹{currentBooking.priceSnapshot}/mo</span>
                            </div>
                        </div>
                    </div>
                )}

                {pendingBooking && !currentBooking && (
                    <div className="pending-booking card">
                        <div className="booking-badge pending">⏳ Pending Approval</div>
                        <h3>{pendingBooking.hostel?.name}</h3>
                        <p className="text-secondary">
                            Your booking request is being reviewed by the admin
                        </p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions-grid">
                    <button
                        className="action-card card card-hover"
                        onClick={() => navigate('/resident/hostels')}
                    >
                        <div className="action-icon">🏨</div>
                        <h3>Browse Hostels</h3>
                        <p>Explore available hostels</p>
                    </button>

                    <button
                        className="action-card card card-hover"
                        onClick={() => navigate('/resident/bookings')}
                    >
                        <div className="action-icon">📋</div>
                        <h3>My Bookings</h3>
                        <p>View booking history</p>
                    </button>

                    <button
                        className="action-card card card-hover owner-apply"
                        onClick={() => navigate('/resident/apply-owner')}
                    >
                        <div className="action-icon">👑</div>
                        <h3>Become an Owner</h3>
                        <p>Apply to manage hostels</p>
                    </button>
                </div>

                {/* Featured Hostels */}
                {!loading && hostels.length > 0 && (
                    <section className="featured-section">
                        <div className="section-header">
                            <h2>Featured Hostels</h2>
                            <button
                                className="btn btn-ghost"
                                onClick={() => navigate('/resident/hostels')}
                            >
                                View All →
                            </button>
                        </div>
                        <div className="hostels-grid">
                            {hostels.map(hostel => (
                                <div
                                    key={hostel._id}
                                    className="hostel-card card card-hover"
                                    onClick={() => navigate(`/resident/book/${hostel._id}`)}
                                >
                                    <h3>{hostel.name}</h3>
                                    <p>📍 {hostel.city}</p>
                                    <p className="text-secondary">{hostel.address}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}
