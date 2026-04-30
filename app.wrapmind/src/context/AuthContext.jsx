import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../lib/supabase';
import { configureAnalytics } from '../lib/analytics';

const AuthContext = createContext(null);

// ── Dev-mode bypass ───────────────────────────────────────────────────────────
// LOCAL_DEV=1 → prototype mode: skip Supabase auth, use localStorage seed data
// LOCAL_DEV=0 → local Supabase auth (via VITE_SUPABASE_URL)
// unset → production Supabase auth
const DEV_AUTH = import.meta.env.VITE_LOCAL_DEV === '1';

const DEV_USER    = { id: 'dev-user', email: 'dev@wrapmind.local' };
const DEV_PROFILE = { id: 'dev-profile', role: 'owner', user_id: 'dev-user' };
const DEV_ORG     = { id: 'dev-org', name: 'Dev Shop' };
const DEV_SESSION = { user: DEV_USER };

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(DEV_AUTH ? DEV_SESSION : null);
  const [user, setUser]         = useState(DEV_AUTH ? DEV_USER    : null);
  const [profile, setProfile]   = useState(DEV_AUTH ? DEV_PROFILE : null);
  const [org, setOrg]           = useState(DEV_AUTH ? DEV_ORG     : null);
  const [loading, setLoading]   = useState(!DEV_AUTH);

  useEffect(() => {
    if (DEV_AUTH) return; // skip Supabase entirely in dev mode

    supabase.auth.getSession().then(({ data: { session: s } }) => {
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
        // Fetch org separately if org_id exists
        if (profileData.org_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.org_id)
            .single();
          setOrg(orgData ?? null);
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
    if (DEV_AUTH) return;
    configureAnalytics(org?.id);
    if (user && org) {
      Sentry.setUser({ id: user.id, email: user.email, org_id: org.id });
    } else if (!user) {
      Sentry.setUser(null);
    }
  }, [user, org]);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    if (DEV_AUTH) return { data: null, error: null };
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
    if (DEV_AUTH) return { data: null, error: null };
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
    if (DEV_AUTH) return { error: null };
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
    if (DEV_AUTH) return { data: null, error: null };
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    if (DEV_AUTH) return { data: null, error: null };
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    return { data, error };
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (DEV_AUTH) return { error: null };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.wrapmind.ai/update-password',
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    if (DEV_AUTH) return { error: null };
    // Ensure we have a valid session before updating password
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: { message: 'No active session. Please request a new password reset link.' } };
    }
    // Brief delay to avoid lock contention with ongoing auth initialization
    await new Promise(resolve => setTimeout(resolve, 300));
    // Retry once if lock contention occurs
    let attempt = 0;
    while (attempt < 2) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) return { error: null };
      // Check if it's a lock error
      if (error.message?.includes('lock') || error.code === 'lock') {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 200 * attempt)); // backoff
        continue;
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
    orgId: DEV_AUTH ? null : (org?.id ?? null),
    loading,
    signUp,
    signIn,
    signOut,
    signInWithMagicLink,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    isAuthenticated: DEV_AUTH ? true : !!session,
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
