import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './OwnerListingManager.css';

const AMENITY_OPTIONS = [
    'WiFi', 'AC', 'Parking', 'Kitchen', 'Laundry', 'TV', 'Gym', 'Swimming Pool',
    'Hot Water', '24x7 Security', 'CCTV', 'Power Backup', 'Elevator', 'Study Room',
    'Cafeteria', 'Housekeeping', 'Meals Included', 'Locker', 'Reading Light', 'Common Area'
];

const CANCELLATION_OPTIONS = ['Free cancellation', 'Moderate', 'Strict', 'Non-refundable'];

export default function OwnerListingManager() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=basic, 2=details, 3=photos
    const [saving, setSaving] = useState(false);
    const [hostelId, setHostelId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [serviceInput, setServiceInput] = useState('');
    const [staffInput, setStaffInput] = useState('');
    const [useGeo, setUseGeo] = useState(false);

    const [form, setForm] = useState({
        name: '', city: '', address: '', description: '',
        pricePerNight: '', maxGuests: 2, totalRooms: 1,
        amenities: [],
        servicesProvided: [],
        staffNames: [],
        houseRules: '',
        cancellationPolicy: 'Free cancellation',
        latitude: '', longitude: ''
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleAmenity = (am) => {
        set('amenities', form.amenities.includes(am)
            ? form.amenities.filter(a => a !== am)
            : [...form.amenities, am]);
    };

    const addService = () => {
        if (!serviceInput.trim()) return;
        set('servicesProvided', [...form.servicesProvided, serviceInput.trim()]);
        setServiceInput('');
    };

    const addStaff = () => {
        if (!staffInput.trim()) return;
        set('staffNames', [...form.staffNames, staffInput.trim()]);
        setStaffInput('');
    };

    const detectLocation = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        setUseGeo(true);
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude, longitude } = pos.coords;
                set('latitude', latitude);
                set('longitude', longitude);
                // Reverse geocode using open Nominatim
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.state || '';
                    if (city && !form.city) set('city', city);
                } catch { }
                setUseGeo(false);
            },
            () => { setUseGeo(false); alert('Location permission denied. Enter coordinates manually.'); }
        );
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(prev => [...prev, ...files].slice(0, 10));
        const previews = files.map(f => URL.createObjectURL(f));
        setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
    };

    const removePhoto = (i) => {
        setPhotos(prev => prev.filter((_, idx) => idx !== i));
        setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    // Step 1: Create hostel
    const handleCreateHostel = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/hostels', {
                ...form,
                amenities: form.amenities,
                servicesProvided: form.servicesProvided,
                staffNames: form.staffNames
            });
            setHostelId(res.data?.data?._id);
            setStep(2);
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to create hostel');
        } finally {
            setSaving(false);
        }
    };

    // Step 2: Update details (already created)
    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/hostels/${hostelId}`, {
                houseRules: form.houseRules,
                cancellationPolicy: form.cancellationPolicy,
                latitude: form.latitude, longitude: form.longitude
            });
            setStep(3);
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    // Step 3: Upload photos & publish
    const handleUploadAndPublish = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (photos.length) {
                const formData = new FormData();
                photos.forEach(p => formData.append('photos', p));
                await api.post(`/hostels/${hostelId}/photos`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            await api.patch(`/hostels/${hostelId}/publish`);
            navigate('/owner');
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Upload failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="listing-manager">
            <div className="listing-manager__header">
                <button className="listing-manager__back" onClick={() => navigate('/owner')}>← Back to Dashboard</button>
                <h1>Create Hostel Listing</h1>
                <div className="listing-manager__steps">
                    {['Basic Info', 'Details', 'Photos & Publish'].map((s, i) => (
                        <div key={i} className={`listing-step ${step === i + 1 ? 'listing-step--active' : step > i + 1 ? 'listing-step--done' : ''}`}>
                            <span>{step > i + 1 ? '✓' : i + 1}</span>{s}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <form className="listing-form" onSubmit={handleCreateHostel}>
                    <h2>Basic Information</h2>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Hostel Name *</label>
                            <input className="input-field" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. The Sunrise Hostel" />
                        </div>
                        <div className="form-field">
                            <label>City *</label>
                            <input className="input-field" required value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Bangalore" />
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Full Address</label>
                        <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, Area, City, PIN" />
                    </div>
                    <div className="form-field">
                        <label>Description</label>
                        <textarea className="input-field" rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your hostel — vibe, location, unique features..." />
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Price Per Night (₹) *</label>
                            <input className="input-field" type="number" required min={1} value={form.pricePerNight} onChange={e => set('pricePerNight', e.target.value)} placeholder="e.g. 1200" />
                        </div>
                        <div className="form-field">
                            <label>Max Guests</label>
                            <input className="input-field" type="number" min={1} max={50} value={form.maxGuests} onChange={e => set('maxGuests', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Total Rooms</label>
                            <input className="input-field" type="number" min={1} value={form.totalRooms} onChange={e => set('totalRooms', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Amenities</label>
                        <div className="amenity-list">
                            {AMENITY_OPTIONS.map(am => (
                                <label key={am} className={`amenity-chip ${form.amenities.includes(am) ? 'amenity-chip--active' : ''}`}>
                                    <input type="checkbox" hidden checked={form.amenities.includes(am)} onChange={() => toggleAmenity(am)} />
                                    {am}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Services Provided</label>
                        <div className="tag-input">
                            <input className="input-field" value={serviceInput} onChange={e => setServiceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())} placeholder="e.g. Airport pickup (press Enter)" />
                            <button type="button" className="btn-outline" onClick={addService}>Add</button>
                        </div>
                        <div className="tag-list">
                            {form.servicesProvided.map((s, i) => (
                                <span key={i} className="tag">{s}<button type="button" onClick={() => set('servicesProvided', form.servicesProvided.filter((_, j) => j !== i))}>✕</button></span>
                            ))}
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Staff Names</label>
                        <div className="tag-input">
                            <input className="input-field" value={staffInput} onChange={e => setStaffInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStaff())} placeholder="e.g. Ravi Kumar (press Enter)" />
                            <button type="button" className="btn-outline" onClick={addStaff}>Add</button>
                        </div>
                        <div className="tag-list">
                            {form.staffNames.map((s, i) => (
                                <span key={i} className="tag">{s}<button type="button" onClick={() => set('staffNames', form.staffNames.filter((_, j) => j !== i))}>✕</button></span>
                            ))}
                        </div>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Continue →'}</button>
                </form>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
                <form className="listing-form" onSubmit={handleUpdateDetails}>
                    <h2>Policies & Location</h2>
                    <div className="form-field">
                        <label>Cancellation Policy</label>
                        <select className="input-field" value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)}>
                            {CANCELLATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="form-field">
                        <label>House Rules</label>
                        <textarea className="input-field" rows={4} value={form.houseRules} onChange={e => set('houseRules', e.target.value)} placeholder="e.g. No smoking, Quiet hours 10PM–7AM, No outside food..." />
                    </div>
                    <div className="form-field">
                        <label>Location Coordinates</label>
                        <button type="button" className="btn-outline" onClick={detectLocation} disabled={useGeo} style={{ marginBottom: 12, fontSize: 13 }}>
                            {useGeo ? '📡 Detecting...' : '📍 Use My Current Location'}
                        </button>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Latitude</label>
                                <input className="input-field" type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 12.9716" />
                            </div>
                            <div className="form-field">
                                <label>Longitude</label>
                                <input className="input-field" type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 77.5946" />
                            </div>
                        </div>
                        {form.latitude && form.longitude && (
                            <div className="listing-map-preview">
                                <iframe
                                    title="Hostel location preview"
                                    src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
                                    loading="lazy" style={{ width: '100%', height: 240, border: 'none', borderRadius: 12 }}
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-outline" type="button" onClick={() => setStep(1)}>← Back</button>
                        <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Continue →'}</button>
                    </div>
                </form>
            )}

            {/* Step 3: Photos */}
            {step === 3 && (
                <form className="listing-form" onSubmit={handleUploadAndPublish}>
                    <h2>Add Photos & Publish</h2>
                    <div className="form-field">
                        <label>Upload Photos (max 10)</label>
                        <div className="photo-upload-area">
                            <input type="file" multiple accept="image/*" onChange={handlePhotoChange} className="photo-upload-input" id="photo-input" />
                            <label htmlFor="photo-input" className="photo-upload-label">
                                📷 Click to add photos
                                <span>JPG, PNG, WebP — max 5MB each</span>
                            </label>
                        </div>
                        <div className="photo-previews">
                            {photoPreviews.map((src, i) => (
                                <div key={i} className="photo-preview">
                                    <img src={src} alt={`Preview ${i + 1}`} />
                                    <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="listing-publish-note">
                        <span>🎉</span>
                        <div>
                            <strong>You're almost done!</strong>
                            <p>Clicking publish will make your hostel visible on the StayNest marketplace immediately.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-outline" type="button" onClick={() => setStep(2)}>← Back</button>
                        <button className="btn-primary" type="submit" disabled={saving}>
                            {saving ? 'Publishing...' : '🚀 Publish Listing'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
