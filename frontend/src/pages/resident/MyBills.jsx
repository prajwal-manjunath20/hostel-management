import { useState, useEffect } from 'react';
import api from '../../api';
import './MyBills.css';

export default function MyBills() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bills/my');
            setBills(response.data || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
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

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            paid: '✅',
            overdue: '⚠️',
            cancelled: '❌'
        };
        return icons[status] || '📄';
    };

    const filteredBills = filter === 'all'
        ? bills
        : bills.filter(bill => bill.status === filter);

    const totalPending = bills
        .filter(b => b.status === 'pending' || b.status === 'overdue')
        .reduce((sum, b) => sum + b.amount, 0);

    const totalPaid = bills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="my-bills">
            <div className="bills-header">
                <h1>💰 My Bills</h1>
            </div>

            <div className="summary-cards">
                <div className="summary-card card">
                    <div className="summary-icon">⏳</div>
                    <div className="summary-details">
                        <h3>{formatCurrency(totalPending)}</h3>
                        <p>Total Pending</p>
                    </div>
                </div>
                <div className="summary-card card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-details">
                        <h3>{formatCurrency(totalPaid)}</h3>
                        <p>Total Paid</p>
                    </div>
                </div>
            </div>

            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
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

            <div className="bills-timeline">
                {loading ? (
                    <div className="loading">Loading bills...</div>
                ) : filteredBills.length === 0 ? (
                    <div className="empty-state card">
                        <p>📄 No bills found</p>
                    </div>
                ) : (
                    filteredBills.map(bill => (
                        <div key={bill._id} className="timeline-item">
                            <div className="timeline-marker">
                                <span className="timeline-icon">{getStatusIcon(bill.status)}</span>
                            </div>
                            <div className="timeline-content card">
                                <div className="bill-header">
                                    <div>
                                        <h3>{bill.invoiceNumber}</h3>
                                        <p className="text-secondary">
                                            {bill.hostel?.name} • Room {bill.room?.roomNumber}
                                        </p>
                                    </div>
                                    <span className={`badge ${getStatusBadge(bill.status)}`}>
                                        {bill.status}
                                    </span>
                                </div>
                                <div className="bill-details">
                                    <div className="detail-row">
                                        <span className="label">Amount:</span>
                                        <span className="value amount">{formatCurrency(bill.amount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Due Date:</span>
                                        <span className="value">{formatDate(bill.dueDate)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Billing Period:</span>
                                        <span className="value">
                                            {bill.billingPeriod.month}/{bill.billingPeriod.year}
                                        </span>
                                    </div>
                                    {bill.paidDate && (
                                        <>
                                            <div className="detail-row">
                                                <span className="label">Paid On:</span>
                                                <span className="value">{formatDate(bill.paidDate)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Payment Method:</span>
                                                <span className="value">{bill.paymentMethod?.replace('_', ' ')}</span>
                                            </div>
                                        </>
                                    )}
                                    {bill.notes && (
                                        <div className="bill-notes">
                                            <span className="label">Notes:</span>
                                            <p>{bill.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {bill.status === 'overdue' && (
                                    <div className="overdue-notice">
                                        ⚠️ This bill is overdue. Please make the payment as soon as possible.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
