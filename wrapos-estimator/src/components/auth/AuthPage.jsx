import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

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
