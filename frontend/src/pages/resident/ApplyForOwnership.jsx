import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './ApplyForOwnership.css';

const ApplyForOwnership = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        businessName: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
        businessCity: '',
        businessDescription: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/owner/apply', formData);

            alert('Application submitted successfully! You will be notified once reviewed.');
            navigate('/resident');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to submit application');
            setLoading(false);
        }
    };

    return (
        <div className="apply-ownership">
            <div className="apply-container">
                <button onClick={() => navigate('/resident')} className="back-btn">
                    ← Back to Dashboard
                </button>

                <div className="apply-header">
                    <h1>🏨 Apply to Become a Hostel Owner</h1>
                    <p>Join our platform and start managing your own hostels</p>
                </div>

                <form onSubmit={handleSubmit} className="apply-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Business Name *</label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            placeholder="Enter your business name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Business Email *</label>
                        <input
                            type="email"
                            name="businessEmail"
                            value={formData.businessEmail}
                            onChange={handleChange}
                            required
                            placeholder="business@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Business Phone *</label>
                        <input
                            type="tel"
                            name="businessPhone"
                            value={formData.businessPhone}
                            onChange={handleChange}
                            required
                            placeholder="+91 1234567890"
                        />
                    </div>

                    <div className="form-group">
                        <label>Business Address *</label>
                        <input
                            type="text"
                            name="businessAddress"
                            value={formData.businessAddress}
                            onChange={handleChange}
                            required
                            placeholder="Street address"
                        />
                    </div>

                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            name="businessCity"
                            value={formData.businessCity}
                            onChange={handleChange}
                            required
                            placeholder="City"
                        />
                    </div>

                    <div className="form-group">
                        <label>Business Description *</label>
                        <textarea
                            name="businessDescription"
                            value={formData.businessDescription}
                            onChange={handleChange}
                            required
                            placeholder="Tell us about your business and why you want to become an owner"
                            rows="5"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>

                <div className="info-box">
                    <h3>What happens next?</h3>
                    <ul>
                        <li>Your application will be reviewed by our admin team</li>
                        <li>You'll receive an email notification once reviewed</li>
                        <li>If approved, you can start creating and managing hostels</li>
                        <li>You'll be able to create staff accounts and manage bookings</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ApplyForOwnership;
