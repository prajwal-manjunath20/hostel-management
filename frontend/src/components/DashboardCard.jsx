// frontend/src/components/DashboardCard.jsx
import './DashboardCard.css';

/**
 * Reusable white card for dashboard metrics and quick actions.
 * Replaces the old gradient .stat-card / .quick-action components.
 */
export default function DashboardCard({
    title,
    subtitle,
    value,
    icon,
    onClick,
    children,
    className = ''
}) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            className={`dashboard-card ${onClick ? 'dashboard-card--clickable' : ''} ${className}`}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {icon && (
                <div className="dashboard-card__icon">{icon}</div>
            )}
            <div className="dashboard-card__content">
                <div className="dashboard-card__title">{title}</div>
                {subtitle && <div className="dashboard-card__subtitle">{subtitle}</div>}
                {value !== undefined && <span className="dashboard-card__value">{value}</span>}
                {children}
            </div>
        </Tag>
    );
}
