import './ui.css';
import Button from './Button';

/**
 * EmptyState — consistent zero-data placeholder.
 *
 * Props:
 *   icon     — emoji or JSX
 *   title    — heading
 *   subtitle — secondary text
 *   cta      — { label, onClick } (optional)
 */
export default function EmptyState({ icon = '🏠', title = 'Nothing here yet', subtitle, cta }) {
    return (
        <div className="ui-empty">
            <div className="ui-empty__icon">{icon}</div>
            <p className="ui-empty__title">{title}</p>
            {subtitle && <p className="ui-empty__sub">{subtitle}</p>}
            {cta && <Button variant="primary" size="md" onClick={cta.onClick}>{cta.label}</Button>}
        </div>
    );
}
