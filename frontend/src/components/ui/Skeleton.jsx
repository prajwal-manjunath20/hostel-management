import './ui.css';

/**
 * Skeleton — token-based shimmer placeholder.
 *
 * Props:
 *   variant — 'text' | 'block' | 'circle'  (default: 'block')
 *   width   — CSS string (default: '100%')
 *   height  — CSS string (required for block/circle)
 *   style   — extra styles
 */
export default function Skeleton({ variant = 'block', width = '100%', height = '16px', style = {}, className = '' }) {
    return (
        <div
            className={`ui-skeleton ui-skeleton--${variant} ${className}`}
            style={{ width, height, ...style }}
            aria-hidden="true"
        />
    );
}

/**
 * SkeletonCard — pre-built hostel card shimmer matching HostelCard layout.
 */
export function SkeletonCard() {
    return (
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Skeleton variant="block" height="200px" />
            <div style={{ padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="38%" />
            </div>
        </div>
    );
}
