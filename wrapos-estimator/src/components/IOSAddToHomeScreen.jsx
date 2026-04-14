import { useState, useEffect } from 'react';

export default function IOSAddToHomeScreen() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('ios-add-to-homescreen-dismissed');
    
    if (isIOS && !isInStandaloneMode && !dismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('ios-add-to-homescreen-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50">
      <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl p-4 border border-neutral-800/50 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700/20 to-neutral-800/20 border border-neutral-700/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm mb-1">Add to Home Screen</p>
            <p className="text-xs text-neutral-400">
              Tap <span className="text-white/80">Share</span> then <span className="text-white/80">Add to Home Screen</span>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-500 hover:text-neutral-300 p-1 -mr-1 -mt-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}