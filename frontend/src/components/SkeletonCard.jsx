import './SkeletonCard.css';

/**
 * Shimmer skeleton card — drop-in placeholder while hostels load.
 * Mirrors the visual footprint of HostelCard.
 */
export default function SkeletonCard() {
    return (
        <div className="skeleton-card-wrap">
            <div className="sk-img" />
            <div className="sk-body">
                <div className="sk-line sk-line--wide" />
                <div className="sk-line sk-line--medium" />
                <div className="sk-line sk-line--narrow" />
            </div>
        </div>
    );
}
