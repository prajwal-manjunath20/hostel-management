import { Link } from 'react-router-dom';
import './HostelCard.css';

const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80';

// API_BASE is used for static file (image) URLs — strips trailing /api if present
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function HostelCard({ hostel, nights = 2 }) {
    const {
        _id, name, city, photos = [], ratingAverage = 0,
        ratingCount = 0, pricePerNight = 0, cancellationPolicy
    } = hostel;

    const imgSrc = photos[0]
        ? (photos[0].startsWith('http') ? photos[0] : `${API_BASE}${photos[0]}`)
        : FALLBACK;

    const totalPrice = pricePerNight * nights;
    const isGuestFavorite = ratingAverage >= 4.7;

    return (
        <Link to={`/hostels/${_id}`} className="hostel-card" aria-label={`View ${name}`}>
            <div className="hostel-card__img-wrap">
                <img
                    src={imgSrc}
                    alt={name}
                    loading="lazy"
                    onError={e => { e.target.src = FALLBACK; }}
                    className="hostel-card__img"
                />
                {isGuestFavorite && (
                    <span className="hostel-card__badge">⭐ Guest Favorite</span>
                )}
                {cancellationPolicy === 'Free cancellation' && (
                    <span className="hostel-card__cancel">Free cancellation</span>
                )}
            </div>
            <div className="hostel-card__body">
                <div className="hostel-card__top">
                    <span className="hostel-card__city">{city || 'India'}</span>
                    {ratingCount > 0 && (
                        <span className="hostel-card__rating">
                            ⭐ {ratingAverage.toFixed(1)}
                            <span className="hostel-card__count"> ({ratingCount})</span>
                        </span>
                    )}
                </div>
                <h3 className="hostel-card__name">{name}</h3>
                <p className="hostel-card__price">
                    <strong>₹{pricePerNight.toLocaleString('en-IN')}</strong> / night
                    <span className="hostel-card__total"> · ₹{totalPrice.toLocaleString('en-IN')} for {nights} nights</span>
                </p>
            </div>
        </Link>
    );
}
