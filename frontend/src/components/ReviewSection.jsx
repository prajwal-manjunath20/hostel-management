import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './ReviewSection.css';

function StarPicker({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-picker">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                    className={`star-pick ${n <= (hover || value) ? 'star-pick--active' : ''}`}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(n)}
                >★</button>
            ))}
        </div>
    );
}

function RatingBar({ label, value, total }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="rating-bar">
            <span className="rating-bar__label">{label}</span>
            <div className="rating-bar__track">
                <div className="rating-bar__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rating-bar__pct">{pct}%</span>
        </div>
    );
}

export default function ReviewSection({ hostelId, ratingAverage, ratingCount }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [breakdown, setBreakdown] = useState([]);
    const [subRatings, setSubRatings] = useState({});
    const [canReview, setCanReview] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        overallRating: 5, cleanliness: 5, location: 5,
        communication: 5, value: 5, comment: ''
    });

    useEffect(() => {
        fetchReviews();
        if (user) checkCanReview();
    }, [hostelId, user]);

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/reviews/hostel/${hostelId}`);
            const d = res.data?.data;
            setReviews(d?.reviews || []);
            setBreakdown(d?.breakdown || []);
            setSubRatings(d?.subRatings || {});
        } catch { }
    };

    const checkCanReview = async () => {
        try {
            const res = await api.get(`/reviews/can-review/${hostelId}`);
            const d = res.data?.data;
            setCanReview(d?.canReview);
            setBookingId(d?.bookingId);
        } catch { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bookingId) return;
        setSubmitting(true);
        try {
            await api.post('/reviews', { ...form, hostelId, bookingId });
            setSubmitted(true);
            setShowForm(false);
            fetchReviews();
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-section">
            {/* Summary */}
            {ratingCount > 0 && (
                <div className="review-summary">
                    <div className="review-summary__avg">
                        <span className="review-summary__number">{ratingAverage?.toFixed(1)}</span>
                        <span className="review-summary__star">⭐</span>
                        {ratingAverage >= 4.7 && <span className="badge badge-gold" style={{ marginLeft: 8 }}>Guest Favorite</span>}
                    </div>
                    <div className="review-summary__bars">
                        {breakdown.map(b => (
                            <RatingBar key={b.star} label={`${b.star} ★`} value={b.count} total={ratingCount} />
                        ))}
                    </div>
                    {Object.keys(subRatings).length > 0 && (
                        <div className="review-sub">
                            {Object.entries(subRatings).map(([k, v]) => (
                                <div key={k} className="review-sub__item">
                                    <span className="review-sub__label">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                                    <span className="review-sub__val">⭐ {v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="review-section__header">
                <h2>Reviews{ratingCount > 0 ? ` (${ratingCount})` : ''}</h2>
                {canReview && !submitted && (
                    <button className="btn-primary" onClick={() => setShowForm(f => !f)} style={{ padding: '9px 20px', fontSize: 13 }}>
                        {showForm ? 'Cancel' : '✍️ Write a Review'}
                    </button>
                )}
                {submitted && <span className="badge badge-green">✓ Review submitted!</span>}
            </div>

            {/* Review Form */}
            {showForm && (
                <form className="review-form fade-in" onSubmit={handleSubmit}>
                    <div className="review-form__row">
                        {[
                            ['overallRating', 'Overall'], ['cleanliness', 'Cleanliness'],
                            ['location', 'Location'], ['communication', 'Communication'], ['value', 'Value']
                        ].map(([key, label]) => (
                            <div key={key} className="review-form__rating">
                                <label>{label}</label>
                                <StarPicker value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
                            </div>
                        ))}
                    </div>
                    <textarea
                        className="review-form__comment input-field"
                        rows={4}
                        placeholder="Share your experience at this hostel..."
                        value={form.comment}
                        onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    />
                    <button className="btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
                <p className="review-empty">No reviews yet. Be the first to review after your stay!</p>
            ) : (
                <div className="review-list">
                    {reviews.map(r => (
                        <div key={r._id} className="review-item">
                            <div className="review-item__header">
                                <div className="review-item__avatar">{r.userId?.name?.[0] || 'U'}</div>
                                <div>
                                    <div className="review-item__name">{r.userId?.name || 'Guest'}</div>
                                    <div className="review-item__date">{new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                                </div>
                                <span className="review-item__rating">⭐ {r.overallRating}</span>
                            </div>
                            {r.comment && <p className="review-item__comment">{r.comment}</p>}
                            <div className="review-item__sub">
                                {['cleanliness', 'location', 'communication', 'value'].map(k => (
                                    <span key={k} className="review-item__sub-item">
                                        {k.charAt(0).toUpperCase() + k.slice(1)}: <strong>{r[k]}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
