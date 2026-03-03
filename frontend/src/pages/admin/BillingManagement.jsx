import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './BillingManagement.css';

export default function BillingManagement() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paymentMethod: 'cash',
        notes: ''
    });

    useEffect(() => {
        fetchStats();
        fetchBills();
    }, [filter]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/bills/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchBills = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.get('/bills', { params });
            setBills(response.data);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBills = async () => {
        try {
            const response = await api.post('/bills/generate', {});
            // After interceptor, response.data is the inner data payload
            const count = response.data?.generated ?? response.data?.count;
            alert(count != null ? `Generated ${count} bill(s) successfully!` : 'Bills generated successfully!');
            setShowGenerateModal(false);
            fetchStats();
            fetchBills();
        } catch (error) {
            alert(error.response?.data?.error?.message || 'Failed to generate bills');
        }
    };

    const handleMarkAsPaid = async () => {
        try {
            await api.patch(`/bills/${selectedBill._id}/pay`, paymentData);
            alert('Bill marked as paid successfully!');
            setShowPaymentModal(false);
            setSelectedBill(null);
            setPaymentData({ paymentMethod: 'cash', notes: '' });
            fetchStats();
            fetchBills();
        } catch (error) {
            alert(error.response?.data?.error?.message || 'Failed to mark as paid');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            paid: 'badge-success',
            overdue: 'badge-danger',
            cancelled: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    };

    return (
        <div className="billing-management">
            <div className="billing-header">
                <h1>💰 Billing Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowGenerateModal(true)}
                >
                    + Generate Monthly Bills
                </button>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card card">
                        <div className="stat-icon">💵</div>
                        <div className="stat-details">
                            <h3>{formatCurrency(stats.totalPending)}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div className="stat-card card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-details">
                            <h3>{formatCurrency(stats.totalOverdue)}</h3>
                            <p>Overdue</p>
                        </div>
                    </div>
                    <div className="stat-card card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-details">
                            <h3>{formatCurrency(stats.totalCollected)}</h3>
                            <p>Collected</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Bills
                </button>
                <button
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                </button>
                <button
                    className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                    onClick={() => setFilter('overdue')}
                >
                    Overdue
                </button>
                <button
                    className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
                    onClick={() => setFilter('paid')}
                >
                    Paid
                </button>
            </div>

            <div className="bills-list">
                {loading ? (
                    <div className="loading">Loading bills...</div>
                ) : bills.length === 0 ? (
                    <div className="empty-state card">
                        <p>📄 No bills found</p>
                    </div>
                ) : (
                    bills.map(bill => (
                        <div key={bill._id} className="bill-card card">
                            <div className="bill-header">
                                <div>
                                    <h3>{bill.invoiceNumber}</h3>
                                    <p className="text-secondary">
                                        {bill.resident?.name} • {bill.hostel?.name} • Room {bill.room?.roomNumber}
                                    </p>
                                </div>
                                <span className={`badge ${getStatusBadge(bill.status)}`}>
                                    {bill.status}
                                </span>
                            </div>
                            <div className="bill-details">
                                <div className="bill-info">
                                    <span className="label">Amount:</span>
                                    <span className="value">{formatCurrency(bill.amount)}</span>
                                </div>
                                <div className="bill-info">
                                    <span className="label">Due Date:</span>
                                    <span className="value">{formatDate(bill.dueDate)}</span>
                                </div>
                                <div className="bill-info">
                                    <span className="label">Period:</span>
                                    <span className="value">
                                        {bill.billingPeriod.month}/{bill.billingPeriod.year}
                                    </span>
                                </div>
                                {bill.paidDate && (
                                    <div className="bill-info">
                                        <span className="label">Paid On:</span>
                                        <span className="value">{formatDate(bill.paidDate)}</span>
                                    </div>
                                )}
                            </div>
                            {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => {
                                        setSelectedBill(bill);
                                        setShowPaymentModal(true);
                                    }}
                                >
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Generate Bills Modal */}
            {showGenerateModal && (
                <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
                    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                        <h2>Generate Monthly Bills</h2>
                        <p className="text-secondary">
                            This will generate bills for all active bookings for the current month.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowGenerateModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleGenerateBills}
                            >
                                Generate Bills
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                        <h2>Mark Bill as Paid</h2>
                        <div className="payment-details">
                            <p><strong>Invoice:</strong> {selectedBill.invoiceNumber}</p>
                            <p><strong>Amount:</strong> {formatCurrency(selectedBill.amount)}</p>
                            <p><strong>Resident:</strong> {selectedBill.resident?.name}</p>
                        </div>
                        <div className="form-group">
                            <label>Payment Method *</label>
                            <select
                                className="input"
                                value={paymentData.paymentMethod}
                                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                                <option value="online">Online</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea
                                className="input"
                                rows="3"
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                placeholder="Add any notes about the payment..."
                            />
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedBill(null);
                                    setPaymentData({ paymentMethod: 'cash', notes: '' });
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleMarkAsPaid}
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
