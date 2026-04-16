// src/components/ui/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, subtitle, width = 'max-w-lg', children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${width} bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-[#243348] flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{title}</h3>
            {subtitle && <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="wm-btn-icon wm-btn-icon-sm ml-3 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-[#243348] flex-shrink-0 bg-gray-50/50 dark:bg-[#0F1923]/30 rounded-b-xl">
      {children}
    </div>
  );
}
