import { useEffect, useRef } from 'react';
import VanillaTilt from 'vanilla-tilt';

/**
 * Wraps any card with a subtle 3D tilt on hover.
 * Usage: <TiltCard><HostelCard hostel={h} /></TiltCard>
 */
export default function TiltCard({ children, max = 6, speed = 380, glare = true }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        VanillaTilt.init(el, {
            max,
            speed,
            glare,
            'max-glare': 0.12,
            scale: 1.02,
        });

        return () => el._vanillaTilt?.destroy();
    }, [max, speed, glare]);

    return (
        <div ref={ref} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
            {children}
        </div>
    );
}
