// frontend/src/pages/admin/HostelManagement.jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './HostelManagement.css';

export default function HostelManagement() {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        totalRooms: ''
    });

    useEffect(() => {
        fetchHostels();
    }, []);

    const fetchHostels = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/hostels', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHostels(res.data || []);
        } catch (error) {
            console.error('Error fetching hostels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await api.post('/hostels', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setFormData({ name: '', address: '', city: '', totalRooms: '' });
            fetchHostels();
        } catch (error) {
            console.error('Error creating hostel:', error);
            alert(error.response?.data?.error?.message || 'Failed to create hostel');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <DashboardLayout role="admin">
            <div className="hostel-management animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Hostel Management</h1>
                        <p className="text-secondary">Manage all hostels in the system</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Create Hostel
                    </button>
                </header>

                {/* Hostels Grid */}
                {loading ? (
                    <div className="hostels-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : hostels.length === 0 ? (
                    <div className="empty-state card">
                        <h2>🏨</h2>
                        <h3>No Hostels Yet</h3>
                        <p>Create your first hostel to get started</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Create Hostel
                        </button>
                    </div>
                ) : (
                    <div className="hostels-grid">
                        {hostels.map(hostel => (
                            <div key={hostel._id} className="hostel-card card card-hover card-glow">
                                <div className="hostel-header">
                                    <h3>{hostel.name}</h3>
                                    <span className="hostel-badge">{hostel.totalRooms} rooms</span>
                                </div>
                                <div className="hostel-details">
                                    <p>📍 {hostel.address}</p>
                                    <p>🏙️ {hostel.city}</p>
                                    <p className="text-tertiary">
                                        Created {new Date(hostel.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create New Hostel</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Hostel Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Sunrise Hostel"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="input"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 123 Main Street"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="input"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Bangalore"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Total Rooms *</label>
                                    <input
                                        type="number"
                                        name="totalRooms"
                                        className="input"
                                        value={formData.totalRooms}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        placeholder="e.g., 50"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Hostel
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
