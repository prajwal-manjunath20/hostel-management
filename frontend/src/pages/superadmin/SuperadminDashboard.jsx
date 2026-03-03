import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import './SuperadminDashboard.css';

const SuperadminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [ownerRequests, setOwnerRequests] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [statsRes, requestsRes, ownersRes] = await Promise.all([
                api.get('/admin/platform-stats'),
                api.get('/admin/owner-requests?status=pending&limit=50'),
                api.get('/admin/all-owners?limit=50')
            ]);
            // After interceptor: res.data is the plain data object/array
            setStats(statsRes.data);
            setOwnerRequests(requestsRes.data || []);
            setOwners(ownersRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/admin/approve-owner/${id}`, {});
            setActionMsg('✅ Owner approved successfully!');
            fetchData();
        } catch (error) {
            setActionMsg('❌ ' + (error.response?.data?.error?.message || 'Failed to approve owner'));
        }
        setTimeout(() => setActionMsg(''), 4000);
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.patch(`/admin/reject-owner/${id}`, { reason });
            setActionMsg('Owner rejected successfully');
            fetchData();
        } catch (error) {
            setActionMsg('❌ ' + (error.response?.data?.error?.message || 'Failed to reject owner'));
        }
        setTimeout(() => setActionMsg(''), 4000);
    };

    const handleSuspend = async () => {
        if (!suspendTarget || !suspendReason.trim()) return;
        try {
            await api.patch(
                `/admin/suspend-owner/${suspendTarget}`,
                { reason: suspendReason }
            );
            setActionMsg('⛔ Account suspended successfully');
            setSuspendTarget(null);
            setSuspendReason('');
            fetchData();
        } catch (err) {
            setActionMsg('❌ ' + (err.response?.data?.error?.message || 'Failed to suspend'));
        }
        setTimeout(() => setActionMsg(''), 4000);
    };

    const handleActivate = async (id) => {
        try {
            await api.patch(`/admin/activate-owner/${id}`, {});
            setActionMsg('✅ Account activated successfully');
            fetchData();
        } catch (err) {
            setActionMsg('❌ ' + (err.response?.data?.error?.message || 'Failed to activate'));
        }
        setTimeout(() => setActionMsg(''), 4000);
    };

    if (loading) return <div className="loading">Loading...</div>;

    const TABS = ['overview', 'requests', 'owners'];

    return (
        <div className="superadmin-dashboard">
            <div className="dashboard-header">
                <h1>🏛️ Platform Administration</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to="/superadmin/analytics" style={{ color: '#4caf50', textDecoration: 'none', fontSize: '14px' }}>
                        📊 Analytics
                    </Link>
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>

            {actionMsg && (
                <div style={{
                    padding: '12px 20px', marginBottom: '16px', borderRadius: '10px',
                    background: actionMsg.startsWith('❌') ? '#fff0f0' : '#e0f5f3',
                    color: actionMsg.startsWith('❌') ? '#c62828' : '#00695c',
                    border: `1px solid ${actionMsg.startsWith('❌') ? '#ffcdd2' : '#b2dfdb'}`,
                    fontWeight: 600, fontSize: '14px'
                }}>
                    {actionMsg}
                </div>
            )}

            {/* Suspend Modal */}
            {suspendTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#ffffff', padding: '32px', borderRadius: '20px',
                        maxWidth: '420px', width: '90%',
                        border: '1px solid #ffcdd2',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.14)'
                    }}>
                        <h3 style={{ color: '#c62828', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>Suspend Account</h3>
                        <p style={{ color: '#717171', marginBottom: '16px', fontSize: '14px' }}>
                            This will block the owner from accessing the platform.
                        </p>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Enter reason for suspension..."
                            style={{
                                width: '100%', minHeight: '80px', padding: '12px',
                                borderRadius: '10px', border: '1px solid #dddddd',
                                background: '#ffffff', color: '#222222', fontSize: '14px',
                                resize: 'vertical', marginBottom: '20px', boxSizing: 'border-box',
                                fontFamily: 'Poppins, sans-serif', outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleSuspend}
                                disabled={!suspendReason.trim()}
                                style={{
                                    flex: 1, padding: '11px', background: '#e02020', color: '#fff',
                                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '14px', fontFamily: 'Poppins, sans-serif'
                                }}
                            >
                                Confirm Suspend
                            </button>
                            <button
                                onClick={() => { setSuspendTarget(null); setSuspendReason(''); }}
                                style={{
                                    flex: 1, padding: '11px', background: '#f5f5f5', color: '#444444',
                                    border: '1px solid #ebebeb', borderRadius: '10px', cursor: 'pointer',
                                    fontFamily: 'Poppins, sans-serif', fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' && 'Overview'}
                        {tab === 'requests' && `Owner Requests (${ownerRequests.length})`}
                        {tab === 'owners' && `All Owners (${owners.length})`}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && stats && (
                <div className="stats-grid">
                    {[
                        { label: 'Total Owners', value: stats.totalOwners },
                        { label: 'Total Hostels', value: stats.totalHostels },
                        { label: 'Total Rooms', value: stats.totalRooms },
                        { label: 'Total Bookings', value: stats.totalBookings },
                        { label: 'Pending Requests', value: stats.pendingOwnerRequests },
                        { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}` }
                    ].map(({ label, value }) => (
                        <div key={label} className="stat-card">
                            <h3>{label}</h3>
                            <p className="stat-value">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="requests-section">
                    <h2>Pending Owner Applications</h2>
                    {ownerRequests.length === 0 ? (
                        <p className="no-data">No pending applications</p>
                    ) : (
                        <div className="requests-list">
                            {ownerRequests.map((request) => (
                                <div key={request._id} className="request-card">
                                    <div className="request-header">
                                        <h3>{request.businessName}</h3>
                                        <span className="status-badge pending">Pending</span>
                                    </div>
                                    <div className="request-details">
                                        <p><strong>Applicant:</strong> {request.user?.name}</p>
                                        <p><strong>Email:</strong> {request.user?.email}</p>
                                        <p><strong>Phone:</strong> {request.businessPhone}</p>
                                        <p><strong>Location:</strong> {request.businessCity}</p>
                                        <p><strong>Description:</strong> {request.businessDescription}</p>
                                        <p><strong>Applied:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="request-actions">
                                        <button onClick={() => handleApprove(request._id)} className="approve-btn">
                                            ✓ Approve
                                        </button>
                                        <button onClick={() => handleReject(request._id)} className="reject-btn">
                                            ✗ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'owners' && (
                <div className="requests-section">
                    <h2>All Platform Owners</h2>
                    {owners.length === 0 ? (
                        <p className="no-data">No approved owners yet</p>
                    ) : (
                        <div className="requests-list">
                            {owners.map((owner) => (
                                <div key={owner._id} className="request-card">
                                    <div className="request-header">
                                        <h3>{owner.name}</h3>
                                        <span className={`status-badge ${owner.accountStatus === 'suspended' ? 'rejected' : 'approved'}`}>
                                            {owner.accountStatus === 'suspended' ? '⛔ Suspended' : '✅ Active'}
                                        </span>
                                    </div>
                                    <div className="request-details">
                                        <p><strong>Email:</strong> {owner.email}</p>
                                        <p><strong>Phone:</strong> {owner.phone || 'N/A'}</p>
                                        <p><strong>Hostels:</strong> {owner.stats?.hostels || 0}</p>
                                        <p><strong>Total Bookings:</strong> {owner.stats?.bookings || 0}</p>
                                        <p><strong>Joined:</strong> {new Date(owner.createdAt).toLocaleDateString()}</p>
                                        {owner.accountStatus === 'suspended' && (
                                            <p style={{ color: '#f44336' }}>
                                                <strong>Reason:</strong> {owner.suspensionReason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="request-actions">
                                        {owner.accountStatus === 'suspended' ? (
                                            <button onClick={() => handleActivate(owner._id)} className="approve-btn">
                                                ✓ Activate
                                            </button>
                                        ) : (
                                            <button onClick={() => setSuspendTarget(owner._id)} className="reject-btn">
                                                ⛔ Suspend
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SuperadminDashboard;
