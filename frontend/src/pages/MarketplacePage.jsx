import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import HostelCard from '../components/HostelCard';
import './MarketplacePage.css';

const AMENITY_OPTIONS = [
    'WiFi', 'AC', 'Parking', 'Kitchen', 'Laundry', 'TV', 'Gym', 'Swimming Pool',
    'Hot Water', '24x7 Security', 'Power Backup', 'Meals Included', 'Locker', 'Study Room'
];

export default function MarketplacePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [hostels, setHostels] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [filters, setFilters] = useState({
        city: searchParams.get('city') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        guests: searchParams.get('guests') || '',
        amenities: [],
        sort: 'rating'
    });

    const fetchHostels = useCallback(async (currentFilters, currentPage) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFilters.city) params.set('city', currentFilters.city);
            if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice);
            if (currentFilters.guests) params.set('guests', currentFilters.guests);
            if (currentFilters.amenities?.length) params.set('amenities', currentFilters.amenities.join(','));
            params.set('sort', currentFilters.sort);
            params.set('page', currentPage);
            params.set('limit', 12);

            const res = await api.get(`/marketplace/hostels?${params.toString()}`);
            const data = res.data?.data;
            setHostels(data?.hostels || []);
            setTotal(data?.pagination?.total || 0);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHostels(filters, page); }, [filters, page, fetchHostels]);

    const toggleAmenity = (am) => {
        setFilters(f => ({
            ...f,
            amenities: f.amenities.includes(am)
                ? f.amenities.filter(a => a !== am)
                : [...f.amenities, am]
        }));
        setPage(1);
    };

    const handleFilterChange = (key, val) => {
        setFilters(f => ({ ...f, [key]: val }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ city: '', minPrice: '', maxPrice: '', guests: '', amenities: [], sort: 'rating' });
        setPage(1);
    };

    const totalPages = Math.ceil(total / 12);

    return (
        <div className="marketplace">
            {/* Header */}
            <div className="marketplace__header">
                <div className="container marketplace__header-inner">
                    <Link to="/" className="marketplace__logo">🏠 StayNest</Link>
                    <div className="marketplace__search-row">
                        <input
                            className="marketplace__city-input input-field"
                            placeholder="🔍 Search city or hostel..."
                            value={filters.city}
                            onChange={e => handleFilterChange('city', e.target.value)}
                        />
                    </div>
                    <div className="marketplace__header-links">
                        <Link to="/login" className="btn-outline" style={{ padding: '8px 20px', fontSize: 13 }}>Login</Link>
                    </div>
                </div>
            </div>

            <div className="container marketplace__body">
                {/* Filter sidebar */}
                <aside className={`marketplace__sidebar ${filtersOpen ? 'marketplace__sidebar--open' : ''}`}>
                    <div className="marketplace__sidebar-header">
                        <h3>Filters</h3>
                        <button className="marketplace__clear" onClick={clearFilters}>Clear all</button>
                    </div>

                    <div className="filter-group">
                        <label>Sort by</label>
                        <select className="input-field" value={filters.sort} onChange={e => handleFilterChange('sort', e.target.value)}>
                            <option value="rating">Top Rated</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Price Range (₹/night)</label>
                        <div className="price-input-group">
                            <div className="price-field">
                                <span className="currency">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={e => handleFilterChange('minPrice', Math.max(0, Number(e.target.value)) || '')}
                                />
                            </div>
                            <div className="price-field">
                                <span className="currency">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={e => handleFilterChange('maxPrice', Math.max(0, Number(e.target.value)) || '')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Guests</label>
                        <div className="guest-control">
                            <button
                                type="button"
                                className="guest-btn"
                                onClick={() => handleFilterChange('guests', Math.max(1, (Number(filters.guests) || 1) - 1))}
                            >−</button>
                            <span className="guest-count">{filters.guests || 1}</span>
                            <button
                                type="button"
                                className="guest-btn"
                                onClick={() => handleFilterChange('guests', Math.min(10, (Number(filters.guests) || 1) + 1))}
                            >+</button>
                        </div>
                    </div>


                    <div className="filter-group">
                        <div className="filter-group__header">
                            <label>Amenities</label>
                            {filters.amenities.length > 0 && (
                                <button
                                    type="button"
                                    className="filter-clear-link"
                                    onClick={() => { setFilters(f => ({ ...f, amenities: [] })); setPage(1); }}
                                >
                                    Clear ({filters.amenities.length})
                                </button>
                            )}
                        </div>
                        <div className="amenities-grid">
                            {AMENITY_OPTIONS.map(am => (
                                <button
                                    key={am}
                                    type="button"
                                    className={`amenity-pill ${filters.amenities.includes(am) ? 'amenity-pill--active' : ''}`}
                                    onClick={() => toggleAmenity(am)}
                                >
                                    {am}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <main className="marketplace__results">
                    <div className="marketplace__results-header">
                        <p className="marketplace__count">
                            {loading ? 'Searching...' : `${total.toLocaleString()} stays found`}
                        </p>
                        <button className="marketplace__filter-toggle btn-outline" onClick={() => setFiltersOpen(o => !o)}>
                            {filtersOpen ? '✕ Close filters' : '⚙️ Filters'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="marketplace__loading">
                            <div className="spinner" />
                            <p>Finding the best hostels...</p>
                        </div>
                    ) : hostels.length === 0 ? (
                        <div className="no-results">
                            <h2>No stays found</h2>
                            <p>Try adjusting your filters or searching another city.</p>
                            <button className="btn-outline" onClick={clearFilters}>Clear filters</button>
                        </div>
                    ) : (
                        <div className="hostel-grid">
                            {hostels.map(h => <HostelCard key={h._id} hostel={h} />)}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && !loading && (
                        <div className="marketplace__pagination">
                            <button className="btn-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                ← Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button className="btn-outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
