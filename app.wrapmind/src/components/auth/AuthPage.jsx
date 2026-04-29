import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ForgotPasswordPage from './ForgotPasswordPage';

export default function AuthPage() {
  const { signIn, signUp, signOut, signInWithMagicLink, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) setError(err.message);
      } else {
        const { data, error: err } = await signUp(email, password, {
          shop_name: shopName,
        });
        if (err) setError(err.message);
        else if (data?.user && !data.session) setConfirmSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signInWithMagicLink(email);
    setSubmitting(false);
    if (!error) setMagicLinkSent(true);
    else setError(error.message);
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-[#7D93AE]">
            We sent a magic link to <span className="text-white">{email}</span>.
            Click it to sign in.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setMode('login'); setError(null); }}
            className="mt-6 text-sm text-blue-400 hover:text-blue-300"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-[#7D93AE]">
            We sent a confirmation link to <span className="text-white">{email}</span>.
            Click it to activate your account.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode('login'); }}
            className="mt-6 text-sm text-blue-400 hover:text-blue-300"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'forgot') {
    return <ForgotPasswordPage onBack={() => { setMode('login'); setError(null); }} />;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-white">WrapMind</h1>
          <p className="text-[#7D93AE] mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your shop account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1B2A3E] rounded-xl p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-[#7D93AE] mb-1">Shop name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Wrap Labs"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#7D93AE] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@yourshop.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7D93AE] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min 8 characters"
            />
          </div>
          {/* ── Remember me + Forgot password ── */}
          <div className="flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="text-[#7D93AE]">Remember me</label>
            </div>
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-blue-400 hover:text-blue-300">
                Forgot password?
              </button>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {/* OAuth providers */}
        <p className="text-center text-xs text-[#7D93AE] mt-4">or continue with</p>
        <div className="grid grid-cols-2 gap-3 mt-2 mb-4">
          <button type="button" onClick={() => signInWithOAuth('google')} disabled={submitting} className="flex items-center justify-center gap-2 py-2 border border-[#243348] rounded-lg text-sm font-medium text-white hover:bg-[#1B2A3E] disabled:opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" onClick={() => signInWithOAuth('github')} disabled={submitting} className="flex items-center justify-center gap-2 py-2 border border-[#243348] rounded-lg text-sm font-medium text-white hover:bg-[#1B2A3E] disabled:opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.795-.24.795-.555v-2.235c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.09 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.42-1.305.765-1.605-2.67-.3-5.466-1.334-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .32.21.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
        </div>

        {/* Magic link button */}
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={submitting || !email}
          className="w-full py-2 border border-[#243348] text-[#7D93AE] font-medium rounded-lg hover:bg-[#1B2A3E] disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Sign in with email link'}
        </button>

        <p className="text-center text-sm text-[#7D93AE] mt-4">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-blue-400 hover:text-blue-300">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); }} className="text-blue-400 hover:text-blue-300">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
