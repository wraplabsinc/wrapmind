import { createContext, useContext, useState, useCallback } from 'react';
import { submitFeedback, loadAllFeedback, respondToFeedback, uploadScreenshot, uploadVoiceMemo } from '../lib/feedback';

import pkg from '../../package.json';
const BUILD = pkg.version || '0.0.0';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsernameState] = useState(
    () => localStorage.getItem('wm-beta-username') || ''
  );
  const setUsername = (val) => {
    setUsernameState(val);
    localStorage.setItem('wm-beta-username', val);
  };

  const getShopName = () => {
    try {
      const profile = JSON.parse(localStorage.getItem('wm-shop-profile') || '{}');
      return profile.name || 'Unknown Shop';
    } catch {
      return 'Unknown Shop';
    }
  };

  /**
   * screenshotDataUrl: base64 JPEG from html2canvas (optional)
   * voiceMemoBlob: Blob from MediaRecorder (optional, already silence-checked by widget)
   * Uploads run in parallel — both are non-fatal so DB insert always fires.
   */
  const submit = useCallback(async ({ reaction, note, screenshotDataUrl, voiceMemoBlob, page }) => {
    setSubmitting(true);
    try {
      const [screenshotUrl, voiceMemoUrl] = await Promise.all([
        screenshotDataUrl ? uploadScreenshot(screenshotDataUrl) : Promise.resolve(null),
        voiceMemoBlob     ? uploadVoiceMemo(voiceMemoBlob)      : Promise.resolve(null),
      ]);
      const entry = await submitFeedback({
        reaction,
        note,
        screenshotUrl,
        voiceMemoUrl,
        page,
        username: username || 'anonymous',
        shopName: getShopName(),
        build: BUILD,
      });
      setItems((prev) => [entry, ...prev]);
      return entry;
    } finally {
      setSubmitting(false);
    }
  }, [username]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadAllFeedback();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const respond = useCallback(async (id, payload) => {
    const updated = await respondToFeedback(id, { ...payload, respondedBy: username || 'admin' });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }, [username]);

  return (
    <FeedbackContext.Provider value={{ items, loading, submitting, username, setUsername, submit, loadAll, respond, BUILD }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}
