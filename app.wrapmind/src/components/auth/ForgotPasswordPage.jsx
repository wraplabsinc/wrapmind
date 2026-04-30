import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    } else {
      setError(error.message || 'Something went wrong');
    }
  }

  if (submitted) {
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
            If an account exists for <span className="text-white">{email}</span>, you'll receive a password reset link shortly.
          </p>
          <button onClick={onBack} className="mt-6 text-sm text-blue-400 hover:text-blue-300">
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
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.766-.054-1.532.218-2.278.465A3.75 3.75 0 0111.25 9.75a2.25 2.25 0 01-.082.044l-.6.213A6 6 0 011.5 12.75c0 1.717.353 3.355.979 4.839A5.99 5.99 0 007.5 21c5.546 0 10.118-2.711 14.022-7.5.633.22 1.224.46 1.773.898A5.991 5.991 0 0017.25 15.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-[#7D93AE] mt-1">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1B2A3E] rounded-xl p-6 space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error.message || error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#7D93AE] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 bg-[#0F1923] border border-[#243348] rounded-lg text-white placeholder-[#4A5E75] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@yourshop.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-[#7D93AE] mt-4">
          Remember your password?{' '}
          <button onClick={onBack} className="text-blue-400 hover:text-blue-300">Sign in</button>
        </p>
      </div>
    </div>
  );
}
