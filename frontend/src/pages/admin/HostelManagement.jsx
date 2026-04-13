// frontend/src/pages/admin/HostelManagement.jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './HostelManagement.css';

const AMENITY_OPTIONS = [
    'WiFi', 'AC', 'Parking', 'Kitchen', 'Laundry', 'TV', 'Gym', 'Swimming Pool',
    'Hot Water', '24x7 Security', 'CCTV', 'Power Backup', 'Elevator', 'Study Room',
    'Cafeteria', 'Housekeeping', 'Meals Included', 'Locker', 'Reading Light', 'Common Area'
];

export default function HostelManagement() {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalStep, setModalStep] = useState(0); // 0=Closed, 1=Hostel, 2=Rooms
    const [createdHostelId, setCreatedHostelId] = useState(null);
    const [roomsToCreate, setRoomsToCreate] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        totalRooms: '',
        description: '',
        pricePerNight: '',
        maxGuests: 2,
        amenities: []
    });

    const [uploadHostelId, setUploadHostelId] = useState(null);
    const [currentPhotos, setCurrentPhotos] = useState([]); // Existing photos in DB
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

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
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/hostels', {
                ...formData,
                totalRooms: Number(formData.totalRooms),
                pricePerNight: Number(formData.pricePerNight),
                maxGuests: Number(formData.maxGuests)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Transition to Step 2: Rooms
            const newHostel = res.data?.data;
            setCreatedHostelId(newHostel._id);
            setModalStep(2);
            
            // Auto-generate initial rooms staged for creation
            generateDefaultRooms(newHostel._id, Number(formData.totalRooms), Number(formData.pricePerNight));
            
            fetchHostels();
        } catch (error) {
            console.error('Error creating hostel:', error);
            alert(error.response?.data?.error?.message || 'Failed to create hostel. Please check your inputs.');
        } finally {
            setSaving(false);
        }
    };

    const generateDefaultRooms = (hostelId, count, basePrice) => {
        const rooms = [];
        for (let i = 1; i <= count; i++) {
            rooms.push({
                roomNumber: (100 + i).toString(),
                type: 'double',
                capacity: 2,
                pricePerMonth: (basePrice || 1000) * 25 // Default monthly approx
            });
        }
        setRoomsToCreate(rooms);
    };

    const handleRoomsSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await api.post('/rooms/bulk', {
                hostelId: createdHostelId,
                rooms: roomsToCreate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Hostel and rooms created successfully!');
            handleCloseModal();
        } catch (error) {
            console.error('Bulk room creation error:', error);
            alert('Hostel created, but room generation failed. You can add rooms manually in "Room Management".');
            handleCloseModal();
        } finally {
            setSaving(false);
        }
    };

    const handleCloseModal = () => {
        setModalStep(0);
        setCreatedHostelId(null);
        setRoomsToCreate([]);
        setFormData({ 
            name: '', address: '', city: '', totalRooms: '', 
            description: '', pricePerNight: '', maxGuests: 2, amenities: [] 
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleAmenity = (am) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(am)
                ? prev.amenities.filter(a => a !== am)
                : [...prev.amenities, am]
        }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(prev => [...prev, ...files].slice(0, 10));
        const previews = files.map(f => URL.createObjectURL(f));
        setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
    };

    const removePhoto = (i) => {
        setPhotos(prev => prev.filter((_, idx) => idx !== i));
        setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleDeletePhoto = async (photoUrl) => {
        if (!window.confirm('Are you sure you want to delete this photo permanently?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/hostels/${uploadHostelId}/photos`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { url: photoUrl }
            });
            
            // Update local state to avoid full re-fetch
            setCurrentPhotos(prev => prev.filter(p => p !== photoUrl));
            fetchHostels(); // Refresh the main list too
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert(error.response?.data?.error?.message || 'Failed to delete photo');
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (photos.length === 0) return alert('Please select at least one photo');
        
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            photos.forEach(p => formData.append('photos', p));
            
            await api.post(`/hostels/${uploadHostelId}/photos`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setUploadHostelId(null);
            setPhotos([]);
            setPhotoPreviews([]);
            fetchHostels();
        } catch (error) {
            console.error('Error uploading photos:', error);
            alert(error.response?.data?.error?.message || 'Failed to upload photos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="hostel-management animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Hostel Management</h1>
                        <p className="text-secondary">Manage all hostels in the system</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setModalStep(1)}>
                        ＋ Create Hostel
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
                        <button className="btn btn-primary" onClick={() => setModalStep(1)}>
                            Create Hostel
                        </button>
                    </div>
                ) : (
                    <div className="hostels-grid">
                        {hostels.map(hostel => (
                            <div key={hostel._id} className="hostel-card card card-hover card-glow">
                                {hostel.photos && hostel.photos.length > 0 ? (
                                    <div className="hostel-cover">
                                        <img src={hostel.photos[0]} alt={hostel.name} />
                                    </div>
                                ) : (
                                    <div className="hostel-cover hostel-cover-placeholder">
                                        🏨 No Image
                                    </div>
                                )}
                                <div className="hostel-card-body">
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
                                    <div className="hostel-actions">
                                        <button 
                                            className="btn btn-secondary btn-small"
                                            onClick={() => {
                                                setUploadHostelId(hostel._id);
                                                setCurrentPhotos(hostel.photos || []);
                                            }}
                                        >
                                            🖼️ Manage Photos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Hostel Wizard */}
                {modalStep > 0 && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className={`modal card ${modalStep === 2 ? 'modal--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-header-info">
                                    <span className="step-indicator">Step {modalStep} of 2</span>
                                    <h2>{modalStep === 1 ? 'Hostel Details' : 'Add Rooms'}</h2>
                                </div>
                                <button className="close-btn" onClick={handleCloseModal}>✕</button>
                            </div>

                            {modalStep === 1 ? (
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

                                    <div className="form-row">
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
                                    </div>

                                    <div className="form-group">
                                        <label>Full Address *</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="input"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g., 123 Main Street, Sector 5"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            className="input textarea"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Describe the hostel, location, and atmosphere..."
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Price Per Night (₹) *</label>
                                            <input
                                                type="number"
                                                name="pricePerNight"
                                                className="input"
                                                value={formData.pricePerNight}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                placeholder="e.g., 1200"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Guests Per Room</label>
                                            <input
                                                type="number"
                                                name="maxGuests"
                                                className="input"
                                                value={formData.maxGuests}
                                                onChange={handleChange}
                                                min="1"
                                                placeholder="e.g., 2"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Amenities</label>
                                        <div className="amenities-selection-grid">
                                            {AMENITY_OPTIONS.map(am => (
                                                <button
                                                    key={am}
                                                    type="button"
                                                    className={`amenity-toggle-chip ${formData.amenities.includes(am) ? 'active' : ''}`}
                                                    onClick={() => toggleAmenity(am)}
                                                >
                                                    {am}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? 'Creating...' : 'Continue to Rooms →'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="room-wizard">
                                    <div className="wizard-intro">
                                        <p>We've staged <strong>{formData.totalRooms}</strong> rooms based on your hostel capacity. Review or edit them below before finishing.</p>
                                    </div>

                                    <div className="wizard-table-wrap">
                                        <table className="wizard-table">
                                            <thead>
                                                <tr>
                                                    <th>Room #</th>
                                                    <th>Type</th>
                                                    <th>Capacity</th>
                                                    <th>Monthly Price (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roomsToCreate.map((room, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <input 
                                                                type="text" 
                                                                value={room.roomNumber}
                                                                onChange={e => {
                                                                    const next = [...roomsToCreate];
                                                                    next[i].roomNumber = e.target.value;
                                                                    setRoomsToCreate(next);
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select 
                                                                value={room.type}
                                                                onChange={e => {
                                                                    const next = [...roomsToCreate];
                                                                    next[i].type = e.target.value;
                                                                    setRoomsToCreate(next);
                                                                }}
                                                            >
                                                                <option value="single">Single</option>
                                                                <option value="double">Double</option>
                                                                <option value="dorm">Dorm</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input 
                                                                type="number" 
                                                                value={room.capacity}
                                                                onChange={e => {
                                                                    const next = [...roomsToCreate];
                                                                    next[i].capacity = Number(e.target.value);
                                                                    setRoomsToCreate(next);
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input 
                                                                type="number" 
                                                                value={room.pricePerMonth}
                                                                onChange={e => {
                                                                    const next = [...roomsToCreate];
                                                                    next[i].pricePerMonth = Number(e.target.value);
                                                                    setRoomsToCreate(next);
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="modal-actions">
                                        <button className="btn btn-primary btn-block" onClick={handleRoomsSubmit} disabled={saving}>
                                            {saving ? 'Creating Rooms...' : '✅ Finish & Create All Rooms'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload Photos Modal */}
                {uploadHostelId && (
                    <div className="modal-overlay" onClick={() => {
                        setUploadHostelId(null);
                        setPhotos([]);
                        setPhotoPreviews([]);
                    }}>
                        <div className="modal card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Manage Photos</h2>
                                <button className="close-btn" onClick={() => {
                                    setUploadHostelId(null);
                                    setCurrentPhotos([]);
                                    setPhotos([]);
                                    setPhotoPreviews([]);
                                }}>✕</button>
                            </div>

                            <div className="modal-section">
                                <label className="modal-label">Current Photos</label>
                                {currentPhotos.length > 0 ? (
                                    <div className="photo-previews existing-photos">
                                        {currentPhotos.map((src, i) => (
                                            <div key={i} className="photo-preview">
                                                <img src={src} alt="Hostel" />
                                                <button 
                                                    type="button" 
                                                    className="photo-remove photo-delete-btn" 
                                                    onClick={() => handleDeletePhoto(src)}
                                                    title="Delete photo permanently"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-photos-text">No photos uploaded yet.</p>
                                )}
                            </div>

                            <hr className="modal-divider" />

                            <form onSubmit={handleUploadSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Upload New Photos (Max 10)</label>
                                    <div className="photo-upload-area">
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/jpeg, image/png, image/webp" 
                                            onChange={handlePhotoChange} 
                                            id="photo-input" 
                                            className="photo-upload-input" 
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="photo-input" className="photo-upload-label">
                                            📷 Click to select photos<br/>
                                            <small>JPEG, PNG, WebP — max 5MB each</small>
                                        </label>
                                    </div>
                                    
                                    {photoPreviews.length > 0 && (
                                        <div className="photo-previews">
                                            {photoPreviews.map((src, i) => (
                                                <div key={i} className="photo-preview">
                                                    <img src={src} alt="Preview" />
                                                    <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => {
                                            setUploadHostelId(null);
                                            setPhotos([]);
                                            setPhotoPreviews([]);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Upload Photos'}
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
