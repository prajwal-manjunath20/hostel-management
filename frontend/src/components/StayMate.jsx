import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api';
import './StayMate.css';

// ─── Intent definitions ────────────────────────────────────────────────────────
const INTENTS = [
    { tags: ['check-in', 'checkin', 'check in', 'arrival time'], reply: () => "Check-in is **2:00 PM** and check-out is **11:00 AM**. Early check-in can usually be arranged — contact the hostel directly." },
    { tags: ['cancel', 'cancellation', 'refund'], reply: () => "Cancellation policies vary by hostel:\n- **Free** — full refund if cancelled 48h before.\n- **Moderate** — 50% refund 5 days before.\n- **Strict** — no refund.\nCheck the policy on each hostel's detail page." },
    { tags: ['price', 'cost', 'how much', 'pricing', 'rate', '₹', 'rupee'], reply: () => "Prices are shown on each hostel card. Use the **booking card** on the detail page to calculate your exact total based on dates and guests." },
    { tags: ['book', 'booking', 'reserve', 'reservation', 'how to book'], reply: () => "Booking is easy:\n1. Find a hostel on **Explore**\n2. Pick your dates\n3. Click **Reserve**\n4. The owner confirms — you'll get an email!" },
    { tags: ['wifi', 'amenities', 'facilities', 'kitchen', 'parking', 'gym', 'pool'], reply: () => "Amenities vary by hostel. Look for the **Amenities** section on each listing — icons show WiFi, AC, Kitchen, Parking, Gym, and more." },
    { tags: ['review', 'rating', 'feedback', 'stars'], reply: () => "You can leave a review **after your check-out date**. Go to the hostel page → scroll to Reviews → submit your rating." },
    { tags: ['safe', 'security', 'safety', 'secure', 'verified'], reply: () => "All StayNest hosts go through our owner approval process. Hostels with 4.7+ ratings earn the **Guest Favorite** badge." },
    { tags: ['login', 'register', 'sign up', 'sign in', 'password', 'account'], reply: () => "Visit **/register** to create an account. After signup, verify your email to unlock bookings and reviews." },
    { tags: ['owner', 'host', 'list my hostel', 'add hostel', 'become owner'], reply: () => "Apply for ownership from your dashboard after registering. Once approved, you can create listings, upload photos, set pricing, and manage bookings." },
    {
        tags: ['show', 'find', 'search', 'hostels in', 'hotels in', 'near', 'nearby', 'bangalore', 'mumbai', 'delhi', 'goa', 'jaipur', 'pune'],
        reply: async (msg, setLoading) => {
            setLoading(true);
            try {
                const cities = ['bangalore', 'mumbai', 'delhi', 'goa', 'jaipur', 'pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad'];
                const city = cities.find(c => msg.toLowerCase().includes(c));
                const params = city ? `?city=${city}&limit=3` : '?limit=3&sort=rating';
                const res = await api.get(`/marketplace/hostels${params}`);
                const hostels = res.data?.data?.hostels || [];
                if (!hostels.length) return `No hostels found${city ? ` in **${city}**` : ''}. Try a different city!`;
                return `Top picks${city ? ` in **${city}**` : ''}:\n\n${hostels.map(h => `• **${h.name}** — ${h.city} | ${h.ratingAverage || 'New'} stars | ₹${h.pricePerNight?.toLocaleString('en-IN')}/night`).join('\n')}\n\nSee all on the **Explore** page.`;
            } catch { return "Couldn't fetch hostels right now. Try using the **Explore** page!"; }
            finally { setLoading(false); }
        }
    }
];

const FRIENDLY_REPLIES = {
    hi: "Hi! How can I help you find the perfect stay?",
    hello: "Hello! Looking for a great hostel? I'm here.",
    hey: "Hey! Ready to explore some amazing stays?",
    thanks: "You're welcome! Anything else I can help with?",
    thankyou: "Happy to help! Let me know if you need anything else.",
    'thank you': "Happy to help!",
    bye: "Goodbye! Have a wonderful journey.",
    goodbye: "Safe travels! Come back anytime.",
    ok: "Sure! What can I help you with?",
    okay: "Sure! Ask me about hostels, pricing, or bookings.",
};

const FALLBACK = "I didn't catch that. Try asking about:\n- **Booking process**\n- **Cancellation policy**\n- **Check-in times**\n- **Hostels in [city]**\n- **Amenities or pricing**";

const INITIAL_MSG = { from: 'bot', text: "Hi! I'm **StayMate** — your StayNest assistant.\n\nAsk me about hostels, bookings, pricing, or policies!" };

function detectIntent(msg) {
    const lower = msg.toLowerCase();
    return INTENTS.find(i => i.tags.some(tag => lower.includes(tag)));
}

function renderText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}

// ─── Component ─────────────────────────────────────────────────────────────────
const TABS = ['Chat', 'Help'];
const HELP_ITEMS = [
    { q: 'Check-in time?', a: 'Check-in is 2:00 PM, check-out is 11:00 AM.' },
    { q: 'How do I book?', a: 'Find a hostel → pick dates → click Reserve. Owner confirms via email.' },
    { q: 'Cancel policy?', a: 'Free / Moderate / Strict — shown on each hostel page.' },
    { q: 'How to become an owner?', a: 'Register → go to dashboard → apply for ownership.' },
    { q: 'Payment methods?', a: 'Payments are handled securely after owner approval.' },
];

export default function StayMate() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('Chat');
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('staymate_history');
            return saved ? JSON.parse(saved) : [INITIAL_MSG];
        } catch { return [INITIAL_MSG]; }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);
    const chatRef = useRef(null);

    // Persist history
    useEffect(() => {
        try { localStorage.setItem('staymate_history', JSON.stringify(messages)); } catch { }
    }, [messages]);

    // Scroll to bottom
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

    // Click outside to close
    useEffect(() => {
        const handler = (e) => {
            if (chatRef.current && !chatRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSend = useCallback(async () => {
        const msg = input.trim();
        if (!msg || loading) return;
        if (msg.length > 300) return;

        setInput('');
        setMessages(prev => [...prev, { from: 'user', text: msg }]);
        setLoading(true);

        const cleaned = msg.toLowerCase().trim();
        if (FRIENDLY_REPLIES[cleaned]) {
            await new Promise(r => setTimeout(r, 900));
            setLoading(false);
            setMessages(prev => [...prev, { from: 'bot', text: FRIENDLY_REPLIES[cleaned] }]);
            return;
        }

        const intent = detectIntent(msg);
        await new Promise(r => setTimeout(r, 1200));

        let reply;
        if (intent) {
            reply = typeof intent.reply === 'function' && intent.reply.constructor.name === 'AsyncFunction'
                ? await intent.reply(msg, setLoading)
                : intent.reply();
        } else {
            reply = FALLBACK;
        }

        setLoading(false);
        setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, [input, loading]);

    const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    const clearHistory = () => {
        setMessages([INITIAL_MSG]);
        localStorage.removeItem('staymate_history');
    };

    const quickReplies = ['How to book?', 'Check-in time', 'Show hostels in Goa', 'Cancellation policy'];

    return (
        <div className="staymate" ref={chatRef}>
            {/* Toggle */}
            <button
                className={`staymate__toggle ${open ? 'staymate__toggle--open' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-label="Open StayMate chat"
            >
                {open ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                )}
                {!open && <span className="staymate__pulse" />}
            </button>

            {open && (
                <div className="staymate__window fade-in">
                    {/* Header */}
                    <div className="staymate__header">
                        <div className="staymate__avatar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                            </svg>
                        </div>
                        <div>
                            <div className="staymate__name">StayMate</div>
                            <div className="staymate__status">● Online</div>
                        </div>
                        <button className="staymate__clear-btn" onClick={clearHistory} title="Clear history">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.41" />
                            </svg>
                        </button>
                        <button className="staymate__close" onClick={() => setOpen(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="staymate__tabs">
                        {TABS.map(t => (
                            <button
                                key={t}
                                className={`staymate__tab ${tab === t ? 'staymate__tab--active' : ''}`}
                                onClick={() => setTab(t)}
                            >{t}</button>
                        ))}
                    </div>

                    {tab === 'Chat' ? (
                        <>
                            <div className="staymate__messages">
                                {messages.map((m, i) => (
                                    <div key={i} className={`staymate__msg staymate__msg--${m.from}`}>
                                        <div className="staymate__bubble" dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
                                    </div>
                                ))}
                                {loading && (
                                    <div className="staymate__msg staymate__msg--bot">
                                        <div className="staymate__bubble staymate__bubble--typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                )}
                                <div ref={endRef} />
                            </div>

                            {messages.length <= 1 && (
                                <div className="staymate__quick">
                                    {quickReplies.map(q => (
                                        <button key={q} className="staymate__quick-btn" onClick={() => { setInput(q); }}>{q}</button>
                                    ))}
                                </div>
                            )}

                            <div className="staymate__input-row">
                                <input
                                    className="staymate__input"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Ask anything..."
                                    disabled={loading}
                                    maxLength={300}
                                />
                                <button className="staymate__send" onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="staymate__help">
                            <p className="staymate__help-heading">Frequently asked</p>
                            {HELP_ITEMS.map((item, i) => (
                                <div key={i} className="staymate__faq">
                                    <div className="staymate__faq-q">{item.q}</div>
                                    <div className="staymate__faq-a">{item.a}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
