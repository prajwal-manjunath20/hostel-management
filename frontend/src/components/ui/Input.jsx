import './ui.css';

/**
 * Input — token-based form field.
 *
 * Props:
 *   label     — string label above the input
 *   error     — string error message below the input
 *   All other props forwarded to <input> / <select>
 */
export default function Input({ label, error, className = '', as: Tag = 'input', children, ...props }) {
    const inputCls = [
        'ui-input',
        error ? 'ui-input--error' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className="ui-input-wrap">
            {label && <label className="ui-label">{label}</label>}
            <Tag className={inputCls} {...props}>
                {children}
            </Tag>
            {error && <span className="ui-error-msg">{error}</span>}
        </div>
    );
}
