// src/components/ui/Button.jsx
// Canonical button — uses wm-btn-* CSS classes which consume ThemeContext CSS vars.
// variant: 'primary' | 'outline' | 'ghost' | 'danger' | 'icon'
// size: 'sm' | 'md' (default) | 'lg'

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  title,
  ...rest
}) {
  const base = `wm-btn-${variant}`;
  const sz = size === 'sm' ? 'wm-btn-sm' : size === 'lg' ? 'wm-btn-lg' : '';
  const iconSz = variant === 'icon' && size === 'sm' ? 'wm-btn-icon-sm' : '';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${sz} ${iconSz} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
