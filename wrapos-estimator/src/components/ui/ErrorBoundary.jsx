import { Component } from 'react';
import * as Sentry from '@sentry/react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[WrapMind] Unhandled render error:', error, info?.componentStack);
    Sentry.captureException(error, { contexts: { react: { componentStack: info?.componentStack } } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  handleClearStorage = () => {
    // Nuclear option: wipe all wm-* keys from localStorage, then reload
    Object.keys(localStorage)
      .filter(k => k.startsWith('wm-'))
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || 'Unknown error';
    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F1923] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-[#1B2A3E] rounded-xl border border-gray-200 dark:border-[#243348] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#243348] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Something went wrong</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">WrapMind hit an unexpected error</p>
            </div>
          </div>

          {/* Error detail */}
          <div className="px-5 py-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              This is usually caused by corrupted data in the browser. You can try recovering without losing your data, or clear everything and start fresh.
            </p>

            {isDev && (
              <pre className="text-[10px] bg-gray-50 dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg p-3 overflow-auto max-h-28 text-red-500 mb-4 leading-snug font-mono whitespace-pre-wrap">
                {msg}
              </pre>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full h-9 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Try to recover
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full h-9 rounded-lg bg-gray-100 dark:bg-[#243348] text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-[#2E3D54] transition-colors"
              >
                Reload page
              </button>
              <button
                onClick={this.handleClearStorage}
                className="w-full h-9 rounded-lg text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear all data and reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
