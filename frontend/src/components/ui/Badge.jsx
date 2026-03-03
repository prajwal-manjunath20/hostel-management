import './ui.css';

/**
 * Badge — pill label.
 * Props: variant — 'coral' | 'green' | 'yellow' | 'gray'  (default: 'coral')
 */
export default function Badge({ children, variant = 'coral', icon, className = '' }) {
    return (
        <span className={`ui-badge ui-badge--${variant} ${className}`}>
            {icon && <span>{icon}</span>}
            {children}
        </span>
    );
}
