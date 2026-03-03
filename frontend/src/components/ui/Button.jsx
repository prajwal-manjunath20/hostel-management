import './ui.css';

/**
 * Button — token-based, never hardcode a color again.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'ghost' | 'danger'  (default: 'primary')
 *   size     — 'sm' | 'md' | 'lg'                            (default: 'md')
 *   full     — boolean, makes button 100% width
 *   loading  — shows spinner + disables
 *   as       — render as 'button' | 'a' | 'div'              (default: 'button')
 *   All other props forwarded (onClick, href, type, disabled…)
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    full = false,
    loading = false,
    as: Tag = 'button',
    className = '',
    disabled,
    ...props
}) {
    const cls = [
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        full ? 'ui-btn--full' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Tag className={cls} disabled={disabled || loading} {...props}>
            {loading && (
                <span className="ui-spinner ui-spinner--sm" style={{ borderTopColor: 'currentColor', borderColor: 'rgba(255,255,255,0.3)' }} />
            )}
            {children}
        </Tag>
    );
}
