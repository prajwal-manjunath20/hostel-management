import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import HostelCard from '../components/HostelCard';
import SkeletonCard from '../components/SkeletonCard';
import useReveal from '../hooks/useReveal';
import './HomePage.css';


const HERO_BG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=90';

const CITY_SUGGESTIONS = [
    'Goa', 'Manali', 'Rishikesh', 'Mumbai', 'Delhi', 'Jaipur',
    'Bangalore', 'Pune', 'Kolkata', 'Chennai', 'Udaipur', 'Varanasi'
];

/* ─── Premium Hero Search ──────────────────────────────────── */
function SearchBar() {
    const [city, setCity] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [expanded, setExpanded] = useState(false);
    const [sticky, setSticky] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const formRef = useRef(null);
    const navigate = useNavigate();

    // Sticky search: activates after 360px scroll
    useEffect(() => {
        const onScroll = () => setSticky(window.scrollY > 360);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Collapse on outside click
    useEffect(() => {
        const handler = (e) => {
            if (formRef.current && !formRef.current.contains(e.target)) {
                setExpanded(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (guests > 1) params.set('guests', guests);
        navigate(`/hostels?${params.toString()}`);
    };

    const filteredCities = CITY_SUGGESTIONS.filter(c =>
        c.toLowerCase().includes(city.toLowerCase()) && city.length > 0
    );

    return (
        <form
            ref={formRef}
            className={`hero-search${expanded ? ' hero-search--expanded' : ''}${sticky ? ' hero-search--sticky' : ''}`}
            onSubmit={handleSubmit}
            onFocus={() => setExpanded(true)}
        >
            {/* Location with autocomplete */}
            <div className="hero-search__field" style={{ position: 'relative' }}>
                <span className="hero-search__label">Location</span>
                <input
                    value={city}
                    onChange={e => { setCity(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                    placeholder="Where are you going?"
                    autoComplete="off"
                />
                {showSuggestions && filteredCities.length > 0 && (
                    <div className="search-suggestions">
                        {filteredCities.map(c => (
                            <div
                                key={c}
                                className="suggestion-item"
                                onMouseDown={() => { setCity(c); setShowSuggestions(false); }}
                            >
                                <span className="suggestion-item__icon">📍</span>
                                {c}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="hero-search__sep" />

            <div className="hero-search__field">
                <span className="hero-search__label">Check-in</span>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>

            <div className="hero-search__sep" />

            <div className="hero-search__field">
                <span className="hero-search__label">Check-out</span>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>

            <div className="hero-search__sep" />

            <div className="hero-search__field">
                <span className="hero-search__label">Guests</span>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={guests}
                    onChange={e => setGuests(Math.max(1, Number(e.target.value)))}
                />
            </div>

            <div className="hero-search__btn-wrapper">
                <button type="submit" className="hero-search__btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Search
                </button>
            </div>
        </form>
    );
}

/* ─── Hostel section with scroll reveal ─────────────────────── */
function HostelSection({ title, icon, hostels, loading, scroll }) {
    const ref = useReveal();
    if (loading) return (
        <div className="home-section">
            <h2 className="section-heading">{icon} {title}</h2>
            <div className="hostel-grid">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        </div>
    );
    if (!hostels.length) return null;
    return (
        <section ref={ref} className="home-section reveal">
            <h2 className="section-heading">{icon} {title}</h2>
            <div className={scroll ? 'hostel-scroll' : 'hostel-grid'}>
                {hostels.map(h => <HostelCard key={h._id} hostel={h} />)}
            </div>
        </section>
    );
}


/* ─── Page ─────────────────────────────────────────────────── */
export default function HomePage() {
    const [featured, setFeatured] = useState({ favorites: [], budget: [], weekend: [], nearby: [] });
    const [loading, setLoading] = useState(true);
    const [parallaxY, setParallaxY] = useState(0);
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    // Parallax: hero image moves at 40% of scroll speed
    useEffect(() => {
        const onScroll = () => setParallaxY(window.scrollY * 0.4);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Load recently viewed from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('sn_recent');
            if (raw) setRecentlyViewed(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                let data;
                try {
                    const res = await api.get('/marketplace/recommendations');
                    data = res.data?.data;
                } catch {
                    const res = await api.get('/marketplace/hostels?sort=rating&limit=8');
                    const all = res.data?.data?.hostels || [];
                    data = {
                        favorites: all.filter(h => h.ratingAverage >= 4.7).slice(0, 4),
                        budget: [...all].sort((a, b) => a.pricePerNight - b.pricePerNight).slice(0, 4),
                        weekend: all.slice(0, 4),
                        nearby: []
                    };
                }
                setFeatured(data || {});
            } catch (err) {
                console.error('Failed to load homepage data', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="homepage">
            {/* Hero with parallax */}
            <section
                className="hero"
                style={{
                    backgroundImage: `url(${HERO_BG})`,
                    backgroundPositionY: `${parallaxY}px`
                }}
            >
                <div className="hero__overlay" />
                <div className="hero__content fade-in">
                    <p className="hero__tagline">Your perfect stay awaits</p>
                    <h1 className="hero__title">Find Your<br /><span>Dream Hostel</span></h1>
                    <p className="hero__sub">Discover warm, welcoming hostels across India — handpicked for comfort, community, and value.</p>
                    <SearchBar />
                </div>
            </section>

            {/* Hostel sections */}
            <div className="container">
                <HostelSection title="Guest Favorites" icon="⭐" hostels={featured.favorites || []} loading={loading} />
                {recentlyViewed.length > 0 && (
                    <HostelSection title="Recently Viewed" icon="🕐" hostels={recentlyViewed} loading={false} scroll />
                )}
                <HostelSection title="Recommended for You" icon="❤️" hostels={featured.nearby || []} loading={false} />
                <HostelSection title="Budget Stays" icon="💰" hostels={featured.budget || []} loading={loading} />
                <HostelSection title="Weekend Escapes" icon="🌅" hostels={featured.weekend || []} loading={loading} />

            </div>

            {/* Footer */}
            <footer className="home-footer">
                <div className="home-footer__grid container">
                    <div className="home-footer__col">
                        <div className="home-footer__logo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF5A5F"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                            StayNest
                        </div>
                        <p>Warm stays, lasting memories.</p>
                    </div>
                    <div className="home-footer__col">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">FAQ</a>
                        <a href="#">Contact Us</a>
                        <a href="#">Customer Care</a>
                    </div>
                    <div className="home-footer__col">
                        <h4>Company</h4>
                        <a href="#">About</a>
                        <a href="#">Cancellation Policy</a>
                        <a href="#">Anti-discrimination</a>
                    </div>
                    <div className="home-footer__col">
                        <h4>Hosting</h4>
                        <Link to="/register">List your hostel</Link>
                        <a href="#">Responsible hosting</a>
                        <a href="#">Community forum</a>
                    </div>
                </div>
                <div className="home-footer__bottom container">
                    <span>© 2025 StayNest, Inc.</span>
                    <div className="home-footer__legal">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Sitemap</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
