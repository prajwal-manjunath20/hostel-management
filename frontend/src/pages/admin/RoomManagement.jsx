// frontend/src/pages/admin/RoomManagement.jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './RoomManagement.css';

export default function RoomManagement() {
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('');
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        roomNumber: '',
        type: 'single',
        capacity: '',
        pricePerMonth: ''
    });

    useEffect(() => {
        fetchHostels();
    }, []);

    useEffect(() => {
        if (selectedHostel) {
            fetchRooms();
        }
    }, [selectedHostel]);

    const fetchHostels = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/hostels', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHostels(res.data || []);
        } catch (error) {
            console.error('Error fetching hostels:', error);
        }
    };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/rooms/${selectedHostel}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(res.data || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await api.post('/rooms', {
                ...formData,
                hostelId: selectedHostel
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setFormData({ roomNumber: '', type: 'single', capacity: '', pricePerMonth: '' });
            fetchRooms();
        } catch (error) {
            console.error('Error creating room:', error);
            alert(error.response?.data?.error?.message || 'Failed to create room');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getRoomTypeIcon = (type) => {
        switch (type) {
            case 'single': return '🛏️';
            case 'double': return '🛏️🛏️';
            case 'dorm': return '🏢';
            default: return '🚪';
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="room-management animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Room Management</h1>
                        <p className="text-secondary">Manage rooms across all hostels</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                        disabled={!selectedHostel}
                    >
                        ➕ Add Room
                    </button>
                </header>

                {/* Hostel Selector */}
                <div className="hostel-selector card">
                    <label>Select Hostel</label>
                    <select
                        className="input"
                        value={selectedHostel}
                        onChange={(e) => setSelectedHostel(e.target.value)}
                    >
                        <option value="">-- Choose a hostel --</option>
                        {hostels.map(hostel => (
                            <option key={hostel._id} value={hostel._id}>
                                {hostel.name} ({hostel.city})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Rooms Grid */}
                {!selectedHostel ? (
                    <div className="empty-state card">
                        <h2>🏨</h2>
                        <h3>Select a Hostel</h3>
                        <p>Choose a hostel from the dropdown to view and manage its rooms</p>
                    </div>
                ) : loading ? (
                    <div className="rooms-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="empty-state card">
                        <h2>🚪</h2>
                        <h3>No Rooms Yet</h3>
                        <p>Add rooms to this hostel to get started</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Add Room
                        </button>
                    </div>
                ) : (
                    <div className="rooms-grid">
                        {rooms.map(room => (
                            <div key={room._id} className="room-card card card-hover">
                                <div className="room-header">
                                    <div className="room-icon">{getRoomTypeIcon(room.type)}</div>
                                    <div className="room-status">
                                        <span className={`status-badge ${room.isAvailable ? 'available' : 'occupied'}`}>
                                            {room.isAvailable ? '✓ Available' : '✗ Occupied'}
                                        </span>
                                    </div>
                                </div>
                                <h3>Room {room.roomNumber}</h3>
                                <div className="room-details">
                                    <p><strong>Type:</strong> {room.type}</p>
                                    <p><strong>Capacity:</strong> {room.capacity} person(s)</p>
                                    <p><strong>Price:</strong> ₹{room.pricePerMonth}/month</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Room Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add New Room</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Room Number *</label>
                                    <input
                                        type="text"
                                        name="roomNumber"
                                        className="input"
                                        value={formData.roomNumber}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 101"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Room Type *</label>
                                    <select
                                        name="type"
                                        className="input"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="single">Single</option>
                                        <option value="double">Double</option>
                                        <option value="dorm">Dorm</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Capacity *</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        className="input"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        placeholder="e.g., 2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Price per Month (₹) *</label>
                                    <input
                                        type="number"
                                        name="pricePerMonth"
                                        className="input"
                                        value={formData.pricePerMonth}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        placeholder="e.g., 5000"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Room
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
