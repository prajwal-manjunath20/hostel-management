// frontend/src/pages/resident/BrowseHostels.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import api from '../../api';
import './BrowseHostels.css';

export default function BrowseHostels() {
    const navigate = useNavigate();
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredHostels = hostels.filter(hostel =>
        hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hostel.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="resident">
            <div className="browse-hostels animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1>Browse Hostels</h1>
                        <p className="text-secondary">Find your perfect accommodation</p>
                    </div>
                </header>

                {/* Search Bar */}
                <div className="search-bar card">
                    <input
                        type="text"
                        className="input"
                        placeholder="🔍 Search by hostel name or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Hostels Grid */}
                {loading ? (
                    <div className="hostels-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                ) : filteredHostels.length === 0 ? (
                    <div className="empty-state card">
                        <h2>🏨</h2>
                        <h3>No Hostels Found</h3>
                        <p>Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <div className="hostels-grid">
                        {filteredHostels.map(hostel => (
                            <div
                                key={hostel._id}
                                className="hostel-card card card-hover card-glow"
                                onClick={() => navigate(`/resident/book/${hostel._id}`)}
                            >
                                <div className="hostel-image">🏨</div>
                                <div className="hostel-content">
                                    <h3>{hostel.name}</h3>
                                    <p className="hostel-location">📍 {hostel.city}</p>
                                    <p className="hostel-address text-secondary">{hostel.address}</p>
                                    <div className="hostel-meta">
                                        <span className="meta-badge">
                                            🛏️ {hostel.totalRooms} rooms
                                        </span>
                                    </div>
                                    <button className="btn btn-primary btn-full">
                                        View Rooms →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
