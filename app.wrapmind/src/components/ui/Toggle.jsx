// src/components/ui/Toggle.jsx
// Single canonical toggle — replaces copies in Settings.jsx and WorkflowPage.jsx.
export default function Toggle({ on, onChange, disabled = false, size = 'md' }) {
  const track = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9';
  const thumb = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const translate = size === 'sm'
    ? (on ? 'translate-x-3' : 'translate-x-0')
    : (on ? 'translate-x-4' : 'translate-x-0');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus-visible:ring-2
        ${track}
        ${on ? '' : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={on ? { backgroundColor: 'var(--accent-primary)' } : {}}
    >
      <span
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ${thumb} ${translate}`}
      />
    </button>
  );
}
