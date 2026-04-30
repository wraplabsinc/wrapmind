import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processingUrl, setProcessingUrl] = useState(true);
  const [recoveryErr, setRecoveryErr] = useState(null);

  // Extract tokens from URL and establish session
  // With detectSessionInUrl: true, Supabase auto-processes the recovery hash on client init.
  // We just need to wait a moment and check getSession().
  useEffect(() => {
    const process = async () => {
      // Safety timeout: unblock spinner after 10s even if Supabase hangs
      const timeout = setTimeout(() => {
        console.warn('Password recovery: timeout after 10s — proceeding anyway');
        setProcessingUrl(false);
        setRecoveryErr('Recovery took too long. Try requesting a new reset link.');
      }, 10000);

      try {
        // Wait for Supabase's auto-initialization (triggered by first auth call) to complete.
        // The client processes the recovery URL hash internally via detectSessionInUrl.
        // Delay briefly, then call getSession() once.
        await new Promise(r => setTimeout(r, 800));

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.warn('No session after delay — hash may be missing, expired, or already used');
          setRecoveryErr('Invalid or expired recovery link. Please request a new one.');
        } else {
          console.log('Recovery session established:', session.user?.email);
        }
      } catch (e) {
        console.error('Unexpected error during password recovery setup:', e);
        setRecoveryErr(e.message || 'Unexpected error during recovery');
      } finally {
        clearTimeout(timeout);
        setProcessingUrl(false);
      }
    };
    process();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await updatePassword(password);
    setSubmitting(false);
    if (!err) {
      setSuccess(true);
      // Redirect to login after brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else {
      setError(err.message);
    }
  }

  if (processingUrl) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If recovery failed (no session, bad link, etc.)
  if (recoveryErr && !success) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid recovery link</h2>
          <p className="text-[#7D93AE] mb-6">{recoveryErr}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password reset successful!</h2>
          <p className="text-[#7D93AE]">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#1B2A3E] rounded-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-white mb-2">Set a new password</h2>
        <p className="text-sm text-[#7D93AE]">Your password must be at least 8 characters.</p>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#7D93AE] mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Min 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#7D93AE] mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Repeat new password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
