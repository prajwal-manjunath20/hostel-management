import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import './HostelDetailPage.css';

// API_BASE is used for static file (image) URLs — strips trailing /api if present
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80';

const AMENITY_ICONS = {
    'WiFi': '📶', 'AC': '❄️', 'Parking': '🅿️', 'Kitchen': '🍳', 'Laundry': '👕', 'TV': '📺', 'Gym': '💪',
    'Swimming Pool': '🏊', 'Hot Water': '🚿', '24x7 Security': '🔒', 'Power Backup': '⚡',
    'Meals Included': '🍽️', 'Locker': '🔑', 'Study Room': '📚', 'Cafeteria': '☕',
    'Common Area': '🛋️', 'Housekeeping': '🧹', 'CCTV': '📹', 'Elevator': '🛗', 'Reading Light': '💡'
};

function StarDisplay({ rating, max = 5 }) {
    return (
        <div className="star-display">
            {Array.from({ length: max }).map((_, i) => (
                <span key={i} style={{ color: i < Math.round(rating) ? '#ffb400' : '#ddd', fontSize: 16 }}>★</span>
            ))}
        </div>
    );
}

function BookingCard({ hostel }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);

    const nights = checkIn && checkOut
        ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
        : 2;

    const total = hostel.pricePerNight * nights;

    const handleReserve = () => {
        if (!user) { navigate('/login'); return; }
        navigate(`/resident/book/${hostel._id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    };

    return (
        <div className="booking-card">
            <div className="booking-card__price">
                <span className="booking-card__amount">₹{hostel.pricePerNight?.toLocaleString('en-IN')}</span>
                <span className="booking-card__per"> / night</span>
            </div>
            {hostel.ratingCount > 0 && (
                <div className="booking-card__rating">
                    ⭐ {hostel.ratingAverage?.toFixed(1)} · <span>{hostel.ratingCount} reviews</span>
                </div>
            )}

            <div className="booking-card__dates">
                <div className="booking-card__date-field booking-card__date-field--left">
                    <label>CHECK-IN</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="booking-card__date-field booking-card__date-field--right">
                    <label>CHECK-OUT</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} />
                </div>
            </div>

            <div className="booking-card__guests">
                <label>GUESTS</label>
                <select value={guests} onChange={e => setGuests(e.target.value)}>
                    {Array.from({ length: hostel.maxGuests || 8 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </div>

            <button className="booking-card__reserve" onClick={handleReserve}>
                {user ? 'Reserve' : 'Login to Reserve'}
            </button>

            {hostel.cancellationPolicy === 'Free cancellation' && (
                <p className="booking-card__cancel">✅ Free cancellation available</p>
            )}

            {checkIn && checkOut && nights > 0 && (
                <div className="booking-card__breakdown">
                    <div className="booking-card__line">
                        <span>₹{hostel.pricePerNight?.toLocaleString('en-IN')} × {nights} night{nights > 1 ? 's' : ''}</span>
                        <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="booking-card__line booking-card__line--total">
                        <strong>Total</strong>
                        <strong>₹{total.toLocaleString('en-IN')}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HostelDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hostel, setHostel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePhoto, setActivePhoto] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/marketplace/hostels/${id}`);
                // api.js interceptor already unwraps the envelope → res.data is the inner data object
                const h = res.data?.hostel;
                setHostel(h);

                // Track recently viewed
                if (h) {
                    try {
                        const raw = localStorage.getItem('sn_recent');
                        const prev = raw ? JSON.parse(raw) : [];
                        const entry = {
                            _id: h._id, name: h.name, city: h.city,
                            photos: h.photos, pricePerNight: h.pricePerNight,
                            ratingAverage: h.ratingAverage, ratingCount: h.ratingCount,
                        };
                        const next = [entry, ...prev.filter(p => p._id !== h._id)].slice(0, 6);
                        localStorage.setItem('sn_recent', JSON.stringify(next));
                    } catch { /* ignore */ }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="detail-loading"><div className="spinner" /></div>;
    if (!hostel) return (
        <div className="detail-notfound">
            <h2>Hostel not found</h2>
            <Link to="/hostels" className="btn-primary">Browse hostels</Link>
        </div>
    );

    const photos = hostel.photos?.length
        ? hostel.photos.map(p => p.startsWith('http') ? p : `${API_BASE}${p}`)
        : [FALLBACK];

    const mapSrc = hostel.latitude && hostel.longitude
        ? `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}&z=15&output=embed`
        : hostel.city
            ? `https://www.google.com/maps?q=${encodeURIComponent(hostel.city + ' India')}&z=13&output=embed`
            : null;

    const isGuestFavorite = hostel.ratingAverage >= 4.7;
    const yearsHosting = hostel.yearsHosting || 1;

    return (
        <div className="detail">
            {/* Top bar */}
            <div className="detail__topbar">
                <div className="container detail__topbar-inner">
                    <button className="detail__back" onClick={() => navigate(-1)}>← Back</button>
                    <Link to="/" className="detail__logo">🏠 StayNest</Link>
                    <div className="detail__actions">
                        <button className="detail__action-btn">🔗 Share</button>
                        <button className="detail__action-btn">❤️ Save</button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Image Gallery */}
                <div className="detail__gallery">
                    <div className="detail__gallery-main">
                        <img
                            src={photos[activePhoto] || FALLBACK}
                            alt={hostel.name}
                            onError={e => { e.target.src = FALLBACK; }}
                        />
                    </div>
                    {photos.length > 1 && (
                        <div className="detail__gallery-thumbs">
                            {photos.slice(1, 5).map((p, i) => (
                                <button key={i} className={`detail__thumb ${activePhoto === i + 1 ? 'detail__thumb--active' : ''}`}
                                    onClick={() => setActivePhoto(i + 1)}>
                                    <img src={p} alt={`Photo ${i + 2}`} onError={e => { e.target.src = FALLBACK; }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail__layout">
                    {/* Left side */}
                    <div className="detail__left">
                        {/* Header */}
                        <div className="detail__header">
                            <div className="detail__badges">
                                {isGuestFavorite && <span className="badge badge-gold">⭐ Guest Favorite</span>}
                                {hostel.cancellationPolicy === 'Free cancellation' && (
                                    <span className="badge badge-green">Free Cancellation</span>
                                )}
                            </div>
                            <h1 className="detail__title">{hostel.name}</h1>
                            <div className="detail__meta">
                                <span className="detail__city">📍 {hostel.city}</span>
                                {hostel.ratingCount > 0 && (
                                    <>
                                        <span className="detail__dot">·</span>
                                        <span>⭐ {hostel.ratingAverage?.toFixed(1)}</span>
                                        <span className="detail__dot">·</span>
                                        <a href="#reviews" className="detail__review-link">{hostel.ratingCount} reviews</a>
                                    </>
                                )}
                            </div>
                        </div>

                        <hr className="detail__divider" />

                        {/* Host info */}
                        <div className="detail__host">
                            <div className="detail__host-avatar">{hostel.owner?.name?.[0] || 'H'}</div>
                            <div>
                                <div className="detail__host-name">Hosted by <strong>{hostel.owner?.name || 'Owner'}</strong></div>
                                <div className="detail__host-years">{yearsHosting} year{yearsHosting > 1 ? 's' : ''} hosting</div>
                            </div>
                        </div>

                        <hr className="detail__divider" />

                        {/* Description */}
                        {hostel.description && (
                            <>
                                <div className="detail__section">
                                    <h2>About this space</h2>
                                    <p className="detail__desc">{hostel.description}</p>
                                </div>
                                <hr className="detail__divider" />
                            </>
                        )}

                        {/* Amenities */}
                        {hostel.amenities?.length > 0 && (
                            <>
                                <div className="detail__section">
                                    <h2>What this place offers</h2>
                                    <div className="detail__amenities">
                                        {hostel.amenities.map(am => (
                                            <div key={am} className="detail__amenity">
                                                <span className="detail__amenity-icon">{AMENITY_ICONS[am] || '✔️'}</span>
                                                <span>{am}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <hr className="detail__divider" />
                            </>
                        )}

                        {/* Services */}
                        {hostel.servicesProvided?.length > 0 && (
                            <>
                                <div className="detail__section">
                                    <h2>Services</h2>
                                    <ul className="detail__list">
                                        {hostel.servicesProvided.map((s, i) => <li key={i}>✓ {s}</li>)}
                                    </ul>
                                </div>
                                <hr className="detail__divider" />
                            </>
                        )}

                        {/* Staff */}
                        {hostel.staffNames?.length > 0 && (
                            <>
                                <div className="detail__section">
                                    <h2>Meet the Team</h2>
                                    <div className="detail__staff">
                                        {hostel.staffNames.map((s, i) => (
                                            <div key={i} className="detail__staff-member">
                                                <div className="detail__staff-avatar">{s[0]}</div>
                                                <span>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <hr className="detail__divider" />
                            </>
                        )}

                        {/* House rules */}
                        {hostel.houseRules && (
                            <>
                                <div className="detail__section">
                                    <h2>House rules</h2>
                                    <p className="detail__desc">{hostel.houseRules}</p>
                                </div>
                                <hr className="detail__divider" />
                            </>
                        )}

                        {/* Map */}
                        {mapSrc && (
                            <div className="detail__section">
                                <h2>📍 Location — {hostel.city}</h2>
                                <div className="detail__map">
                                    <iframe
                                        title="Hostel location"
                                        src={mapSrc}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div id="reviews">
                            <ReviewSection hostelId={id} ratingAverage={hostel.ratingAverage} ratingCount={hostel.ratingCount} />
                        </div>
                    </div>

                    {/* Right sticky booking card */}
                    <div className="detail__right">
                        <div className="detail__sticky">
                            <BookingCard hostel={hostel} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
