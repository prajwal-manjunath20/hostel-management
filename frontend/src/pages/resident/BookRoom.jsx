// frontend/src/pages/resident/BookRoom.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../../api';
import SkeletonCard from '../../components/SkeletonCard';
import SuccessModal from '../../components/SuccessModal';
import './BookRoom.css';

export default function BookRoom() {
    const { hostelId } = useParams();
    const navigate = useNavigate();
    const [hostel, setHostel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({ checkIn: '', checkOut: '' });

    useEffect(() => { fetchData(); }, [hostelId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [hostelRes, roomsRes] = await Promise.all([
                api.get('/hostels', config),
                api.get(`/rooms/${hostelId}`, config)
            ]);
            const hostelData = (hostelRes.data || []).find(h => h._id === hostelId);
            setHostel(hostelData);
            setRooms((roomsRes.data || []).filter(r => r.isAvailable));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoom) { alert('Please select a room'); return; }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await api.post('/bookings', {
                roomId: selectedRoom._id,
                hostelId,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut
            }, { headers: { Authorization: `Bearer ${token}` } });

            // 🎉 Celebrate!
            confetti({
                particleCount: 130,
                spread: 85,
                origin: { y: 0.62 },
                colors: ['#FF5A5F', '#ffcdd2', '#ffffff', '#FF8A80'],
            });
            setShowSuccess(true);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(error.response?.data?.error?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const getRoomTypeIcon = (type) => {
        switch (type) {
            case 'single': return '🛏️';
            case 'double': return '🛏️🛏️';
            case 'dorm': return '🏢';
            default: return '🚪';
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <>
            <SuccessModal
                show={showSuccess}
                title="Booking Confirmed!"
                message={`Room ${selectedRoom?.roomNumber} is reserved. Check your email for details.`}
                ctaLabel="View My Bookings"
                onClose={() => { setShowSuccess(false); navigate('/resident/bookings'); }}
            />

            <div className="book-room animate-fade-in" style={{ padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
                <header className="page-header">
                    <div>
                        <h1>{hostel?.name}</h1>
                        <p className="text-secondary">📍 {hostel?.city} · {hostel?.address}</p>
                    </div>
                </header>

                <div className="booking-container">
                    {/* Available Rooms */}
                    <div className="rooms-section">
                        <h2>Available Rooms</h2>
                        {rooms.length === 0 ? (
                            <div className="empty-state card">
                                <h3>No Available Rooms</h3>
                                <p>All rooms are currently occupied</p>
                            </div>
                        ) : (
                            <div className="rooms-list">
                                {rooms.map(room => (
                                    <div
                                        key={room._id}
                                        className={`room-option card card-hover ${selectedRoom?._id === room._id ? 'selected' : ''}`}
                                        onClick={() => setSelectedRoom(room)}
                                    >
                                        <div className="room-icon-large">{getRoomTypeIcon(room.type)}</div>
                                        <div className="room-info">
                                            <h3>Room {room.roomNumber}</h3>
                                            <p className="room-type">{room.type.toUpperCase()}</p>
                                            <p className="text-secondary">Capacity: {room.capacity} person(s)</p>
                                            <p className="room-price">₹{room.pricePerMonth}/month</p>
                                        </div>
                                        {selectedRoom?._id === room._id && <div className="selected-badge">✓</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Booking Form */}
                    <div className="booking-form-section">
                        <div className="booking-form card">
                            <h2>Booking Details</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Check-in Date *</label>
                                    <input type="date" name="checkIn" className="input" value={formData.checkIn} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
                                </div>
                                <div className="form-group">
                                    <label>Check-out Date *</label>
                                    <input type="date" name="checkOut" className="input" value={formData.checkOut} onChange={handleChange} min={formData.checkIn || new Date().toISOString().split('T')[0]} required />
                                </div>

                                {selectedRoom && (
                                    <div className="booking-summary">
                                        <h3>Booking Summary</h3>
                                        <div className="summary-row"><span>Room</span><span>Room {selectedRoom.roomNumber}</span></div>
                                        <div className="summary-row"><span>Type</span><span>{selectedRoom.type}</span></div>
                                        <div className="summary-row"><span>Price</span><span className="price-highlight">₹{selectedRoom.pricePerMonth}/month</span></div>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary btn-full" disabled={!selectedRoom || submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Booking Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
