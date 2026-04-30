import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../lib/supabase';
import { configureAnalytics } from '../lib/analytics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null);
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [org, setOrg]           = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfileAndOrg(s.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfileAndOrg(s.user.id);
        ensureProfile(s.user.id, s.user.email).catch(() => {});
      } else {
        setProfile(null);
        setOrg(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfileAndOrg(userId) {
    // Skip profile fetch on password reset/forgot routes — not needed and can trigger RLS/406
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path.startsWith('/update-password') || path.startsWith('/forgot-password')) {
      setLoading(false);
      return;
    }
    try {
      // Fetch profile first (without join to avoid RLS/complexity issues)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (profileData) {
        setProfile(profileData);
        // Fetch org separately if org_id exists (best-effort, RLS may block)
        if (profileData.org_id) {
          try {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profileData.org_id)
              .single();
            setOrg(orgData ?? null);
          } catch (orgErr) {
            console.warn('[AuthContext] Could not fetch org:', orgErr);
            setOrg(null);
          }
        } else {
          setOrg(null);
        }
      }
    } catch {
      // Profile may not exist yet (first login before migration runs)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
      configureAnalytics(user.id);
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  }, []);

  // Ensures a profiles row exists for the user. Creates one with default org if missing.
  async function ensureProfile(userId, email) {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      user_id: userId,
      org_id: '00000000-0000-0000-0000-000000000001',
      email,
      role: 'estimator',
      is_active: true,
    }).select().single().catch(() => null);
    // Silently ignore — profile may already exist from trigger
  }

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email);
    }
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setOrg(null);
    }
    return { error };
  }, []);

  // ── Extended auth methods (Phase 1) ──────────────────────────────────────
  const signInWithMagicLink = useCallback(async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    return { data, error };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.wrapmind.ai/update-password',
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    // Brief delay to avoid lock contention with ongoing auth initialization
    await new Promise(resolve => setTimeout(resolve, 300));
    // Retry up to 3 times if lock contention occurs
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) return { error: null };
      // Check if it's a lock error
      if (error.message?.includes('lock') || error.code === 'lock') {
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt)); // increasing backoff
          continue;
        }
      }
      return { error };
    }
    return { error: { message: 'Failed to update password due to lock contention. Please try again.' } };
  }, []);

  const value = {
    session,
    user,
    profile,
    profileId: profile?.id ?? null,
    org,
    orgId: (org?.id ?? null),
    loading,
    signUp,
    signIn,
    signOut,
    signInWithMagicLink,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    isAuthenticated: !!session,
    role: profile?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
