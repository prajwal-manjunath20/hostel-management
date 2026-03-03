import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './OwnerStaffManagement.css';

const OwnerStaffManagement = () => {
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/owner/staff');
            // After interceptor: response.data is the inner data
            // Backend returns { staff: [...] } inside data field, or an array directly
            setStaff(response.data?.staff || response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/owner/staff', formData);
            alert('Staff created successfully!');
            setShowForm(false);
            setFormData({ name: '', email: '', password: '', phone: '' });
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.error?.message || 'Failed to create staff');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;

        try {
            await api.delete(`/owner/staff/${id}`);
            alert('Staff deleted successfully');
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.error?.message || 'Failed to delete staff');
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="staff-management">
            <div className="page-header">
                <button onClick={() => navigate('/owner')} className="back-btn">
                    ← Back to Dashboard
                </button>
                <h1>👥 Staff Management</h1>
                <button onClick={() => setShowForm(!showForm)} className="create-btn">
                    {showForm ? 'Cancel' : '+ Create Staff'}
                </button>
            </div>

            {showForm && (
                <div className="create-form">
                    <h2>Create New Staff Member</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength="8"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="submit-btn">Create Staff</button>
                    </form>
                </div>
            )}

            <div className="staff-list">
                <h2>Your Staff ({staff.length})</h2>
                {staff.length === 0 ? (
                    <div className="no-data">
                        <p>No staff members yet. Create your first staff account!</p>
                    </div>
                ) : (
                    <div className="staff-grid">
                        {staff.map((member) => (
                            <div key={member._id} className="staff-card">
                                <div className="staff-header">
                                    <h3>{member.name}</h3>
                                    <span className="role-badge">Staff</span>
                                </div>
                                <div className="staff-details">
                                    <p>📧 {member.email}</p>
                                    {member.phone && <p>📱 {member.phone}</p>}
                                    <p className="created-date">
                                        Created: {new Date(member.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="staff-actions">
                                    <button
                                        onClick={() => handleDelete(member._id)}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerStaffManagement;
