// src/components/ui/Card.jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`wm-card bg-white dark:bg-[#1B2A3E] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, children, className = '' }) {
  return (
    <div className={`wm-card-header border-b border-gray-100 dark:border-[#243348] flex items-center justify-between ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{title}</h3>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`wm-card-body ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{hint}</p>}
    </div>
  );
}

export function CheckboxRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
            ${checked ? 'border-[var(--accent-primary)]' : 'border-gray-300 dark:border-gray-600'}`}
          style={checked ? { backgroundColor: 'var(--accent-primary)' } : {}}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] group-hover:text-[var(--accent-primary)] transition-colors">{label}</p>
        {description && <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

export function SectionHeader({ children }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{children}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon, children }) {
  return (
    <div className="h-11 flex items-center px-6 border-b border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] flex-shrink-0 gap-3">
      {icon && <div className="flex-shrink-0 text-[#64748B] dark:text-[#7D93AE]">{icon}</div>}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] truncate">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

export function ComingSoon({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle,rgba(46,139,240,0.08))] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#64748B] dark:text-[#7D93AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Coming soon</p>
      </div>
    </div>
  );
}
