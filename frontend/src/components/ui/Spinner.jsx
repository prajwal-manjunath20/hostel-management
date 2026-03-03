import './ui.css';

/**
 * Spinner — coral rotating ring.
 * Props: size — 'sm' | 'md' | 'lg'  (default: 'md')
 *        center — wraps in a centered flex div
 */
export default function Spinner({ size = 'md', center = true }) {
    const el = <span className={`ui-spinner ui-spinner--${size}`} role="status" aria-label="Loading" />;
    return center ? <div className="ui-spinner-wrap">{el}</div> : el;
}
