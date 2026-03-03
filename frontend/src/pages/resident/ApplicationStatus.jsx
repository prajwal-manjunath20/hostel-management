import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './ApplicationStatus.css';

const ApplicationStatus = () => {
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplication();
    }, []);

    const fetchApplication = async () => {
        try {
            const response = await api.get('/owner/my-application');
            // After interceptor: response.data is the inner data object { application: {...} }
            setApplication(response.data?.application || response.data || null);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching application:', error);
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    icon: '⏳',
                    title: 'Application Under Review',
                    message: 'Your application is being reviewed by our admin team.',
                    color: '#FFA726'
                };
            case 'approved':
                return {
                    icon: '✅',
                    title: 'Application Approved!',
                    message: 'Congratulations! You can now create and manage hostels.',
                    color: '#4CAF50'
                };
            case 'rejected':
                return {
                    icon: '❌',
                    title: 'Application Rejected',
                    message: 'Unfortunately, your application was not approved.',
                    color: '#f44336'
                };
            default:
                return {
                    icon: '📝',
                    title: 'No Application',
                    message: 'You have not applied for ownership yet.',
                    color: '#666'
                };
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!application) {
        return (
            <div className="application-status">
                <div className="status-container">
                    <button onClick={() => navigate('/resident')} className="back-btn">
                        ← Back to Dashboard
                    </button>
                    <div className="no-application">
                        <h1>📝 No Application Found</h1>
                        <p>You haven't applied for ownership yet.</p>
                        <button
                            onClick={() => navigate('/resident/apply-owner')}
                            className="apply-btn"
                        >
                            Apply Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(application.status);

    return (
        <div className="application-status">
            <div className="status-container">
                <button onClick={() => navigate('/resident')} className="back-btn">
                    ← Back to Dashboard
                </button>

                <div className="status-card" style={{ borderColor: statusInfo.color }}>
                    <div className="status-icon" style={{ color: statusInfo.color }}>
                        {statusInfo.icon}
                    </div>
                    <h1>{statusInfo.title}</h1>
                    <p className="status-message">{statusInfo.message}</p>

                    <div className="application-details">
                        <h2>Application Details</h2>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Business Name:</span>
                                <span className="value">{application.businessName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Business Email:</span>
                                <span className="value">{application.businessEmail}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Business Phone:</span>
                                <span className="value">{application.businessPhone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">City:</span>
                                <span className="value">{application.businessCity}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Submitted:</span>
                                <span className="value">
                                    {new Date(application.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Status:</span>
                                <span className="value" style={{ color: statusInfo.color, fontWeight: 'bold' }}>
                                    {application.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {application.status === 'rejected' && application.rejectionReason && (
                            <div className="rejection-reason">
                                <h3>Rejection Reason:</h3>
                                <p>{application.rejectionReason}</p>
                                <button
                                    onClick={() => navigate('/resident/apply-owner')}
                                    className="reapply-btn"
                                >
                                    Apply Again
                                </button>
                            </div>
                        )}

                        {application.status === 'approved' && (
                            <div className="success-actions">
                                <button
                                    onClick={() => navigate('/owner')}
                                    className="dashboard-btn"
                                >
                                    Go to Owner Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationStatus;
