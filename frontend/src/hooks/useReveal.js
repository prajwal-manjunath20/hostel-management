// src/hooks/useReveal.js
import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver that adds `.reveal-visible` when
 * the element enters the viewport. Use with className="reveal".
 */
export default function useReveal(threshold = 0.15) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('reveal-visible');
                    observer.unobserve(el); // fire once
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
}
