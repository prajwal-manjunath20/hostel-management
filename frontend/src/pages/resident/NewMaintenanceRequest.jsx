import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './NewMaintenanceRequest.css';

export default function NewMaintenanceRequest() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [formData, setFormData] = useState({
        hostelId: '',
        roomId: '',
        title: '',
        description: '',
        category: 'other'
    });
    const [loading, setLoading] = useState(false);
    const [fetchingBookings, setFetchingBookings] = useState(true);

    useEffect(() => {
        fetchActiveBookings();
    }, []);

    const fetchActiveBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/bookings/my', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const approved = res.data.filter(b => b.status === 'approved');
            setBookings(approved);

            if (approved.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    hostelId: approved[0].hostel._id,
                    roomId: approved[0].room._id
                }));
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setFetchingBookings(false);
        }
    };

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await api.post('/maintenance', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Maintenance request submitted successfully!');
            navigate('/resident/maintenance/my');
        } catch (error) {
            console.error('Error creating request:', error);
            alert(error.response?.data?.error?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
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

    if (fetchingBookings) {
        return (
            <DashboardLayout role="resident">
                <div className="new-maintenance-request">
                    <div className="skeleton skeleton-card" style={{ height: '400px' }} />
                </div>
            </DashboardLayout>
        );
    }

    if (bookings.length === 0) {
        return (
            <DashboardLayout role="resident">
                <div className="new-maintenance-request animate-fade-in">
                    <div className="empty-state card">
                        <h2>🏠</h2>
                        <h3>No Active Bookings</h3>
                        <p>You need an approved booking to submit maintenance requests</p>
                        <button className="btn btn-primary" onClick={() => navigate('/resident/browse')}>
                            Browse Hostels
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="resident">
            <div className="new-maintenance-request animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>New Maintenance Request</h1>
                        <p className="text-secondary">Report an issue in your room</p>
                    </div>
                </header>

                <form onSubmit={onSubmit} className="request-form card">
                    <div className="form-group">
                        <label>Room Location *</label>
                        <select
                            name="roomId"
                            className="input"
                            value={formData.roomId}
                            onChange={(e) => {
                                const booking = bookings.find(b => b.room._id === e.target.value);
                                setFormData({
                                    ...formData,
                                    roomId: e.target.value,
                                    hostelId: booking.hostel._id
                                });
                            }}
                            required
                        >
                            {bookings.map(booking => (
                                <option key={booking._id} value={booking.room._id}>
                                    {booking.hostel.name} - Room {booking.room.roomNumber}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Category *</label>
                        <div className="category-grid">
                            {['plumbing', 'electrical', 'furniture', 'cleaning', 'other'].map(cat => (
                                <label key={cat} className={`category-option ${formData.category === cat ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="category"
                                        value={cat}
                                        checked={formData.category === cat}
                                        onChange={onChange}
                                    />
                                    <span className="category-icon">{getCategoryIcon(cat)}</span>
                                    <span className="category-label">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Issue Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="input"
                            value={formData.title}
                            onChange={onChange}
                            required
                            maxLength="200"
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    <div className="form-group">
                        <label>Detailed Description *</label>
                        <textarea
                            name="description"
                            className="input"
                            value={formData.description}
                            onChange={onChange}
                            required
                            maxLength="1000"
                            rows="5"
                            placeholder="Provide details about the issue..."
                        />
                        <small className="text-secondary">
                            {formData.description.length}/1000 characters
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/resident/maintenance/my')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
