import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Bar = ({ value, max, color = '#4caf50', label }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', /* keep amount on top */ }}>
                {value > 0 ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value) : ''}
            </div>
            <div style={{
                width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '70%', height: `${pct}%`, minHeight: pct > 0 ? '4px' : 0,
                    background: color, borderRadius: '4px 4px 0 0',
                    transition: 'height 0.6s ease'
                }} />
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {label}
            </div>
        </div>
    );
};

export default function AnalyticsDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                // After interceptor: res.data is already the inner data object
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.error?.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p>Loading analytics...</p>
            </div>
        </div>
    );
    if (error) return (
        <div style={{ color: '#f44336', textAlign: 'center', padding: '60px', fontSize: '18px' }}>
            ❌ {error}
        </div>
    );

    const { summary, revenueByMonth, ownerGrowth, topHostels, occupancy } = data;
    const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue), 1);
    const maxOwners = Math.max(...ownerGrowth.map(o => o.newOwners), 1);

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>📊 Platform Analytics</h1>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>Real-time insights into your platform</p>
                </div>
                <button
                    onClick={() => navigate('/superadmin')}
                    style={{
                        padding: '10px 20px', background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                        color: '#fff', cursor: 'pointer', fontSize: '14px'
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Total Owners', value: summary.totalOwners, icon: '👥', color: '#667eea' },
                    { label: 'Total Hostels', value: summary.totalHostels, icon: '🏨', color: '#4caf50' },
                    { label: 'Active Bookings', value: summary.totalBookings, icon: '📋', color: '#ff9800' },
                    { label: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString()}`, icon: '💰', color: '#f5576c' },
                    { label: 'Pending Bills', value: summary.pendingBills, icon: '⏳', color: '#764ba2' },
                    { label: 'Occupancy Rate', value: `${summary.occupancyRate}%`, icon: '🏠', color: '#2196f3' }
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px', padding: '20px', borderLeft: `3px solid ${color}`
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Revenue by Month */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '24px'
                }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#eee' }}>💰 Revenue by Month (Last 12 Mo)</h3>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
                        {revenueByMonth.map((r) => (
                            <Bar
                                key={`${r.year}-${r.month}`}
                                value={r.revenue}
                                max={maxRevenue}
                                color="#4caf50"
                                label={r.monthName}
                            />
                        ))}
                    </div>
                </div>

                {/* Owner Growth */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '24px'
                }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#eee' }}>👥 New Owners (Last 6 Mo)</h3>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
                        {ownerGrowth.map((o) => (
                            <Bar
                                key={`${o.year}-${o.month}`}
                                value={o.newOwners}
                                max={maxOwners}
                                color="#667eea"
                                label={o.monthName}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Occupancy + Top Hostels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Occupancy */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '24px', textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#eee' }}>🏠 Platform Occupancy</h3>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <svg width="160" height="160" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
                            <circle
                                cx="80" cy="80" r="62"
                                fill="none"
                                stroke="#2196f3"
                                strokeWidth="16"
                                strokeDasharray={`${(occupancy.rate / 100) * 389.6} 389.6`}
                                strokeLinecap="round"
                                transform="rotate(-90 80 80)"
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2196f3' }}>{occupancy.rate}%</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>occupied</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', color: '#888', fontSize: '13px' }}>
                        <p style={{ margin: '4px 0' }}>{occupancy.occupiedRooms} / {occupancy.totalRooms} rooms</p>
                    </div>
                </div>

                {/* Top Hostels */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '24px'
                }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#eee' }}>🏆 Top Hostels by Bookings</h3>
                    {topHostels.length === 0 ? (
                        <p style={{ color: '#666' }}>No booking data yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topHostels.map((h, i) => {
                                const maxB = topHostels[0]?.totalBookings || 1;
                                const pct = (h.totalBookings / maxB) * 100;
                                return (
                                    <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ color: '#888', width: '20px', fontSize: '13px' }}>#{i + 1}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                                                {h.hostelInfo?.name || 'Unknown'}
                                                {h.hostelInfo?.city && <span style={{ color: '#666', fontSize: '11px' }}> · {h.hostelInfo.city}</span>}
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '4px' }}>
                                                <div style={{
                                                    height: '100%', width: `${pct}%`,
                                                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                        </div>
                                        <span style={{ color: '#4caf50', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {h.totalBookings} bookings
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
