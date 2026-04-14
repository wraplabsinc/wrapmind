import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../lib/supabase';
import { configureAnalytics } from '../lib/analytics';

const AuthContext = createContext(null);

// ── Dev-mode bypass ───────────────────────────────────────────────────────────
// When VITE_DEV_AUTH=1 the app skips Supabase auth entirely and runs with
// local seed data. Never set this in production.
const DEV_AUTH = import.meta.env.VITE_DEV_AUTH === '1';

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfileAndOrg(s.user.id);
      else {
        setProfile(null);
        setOrg(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfileAndOrg(userId) {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (profileData) {
        setProfile(profileData);
        setOrg(profileData.organizations ?? null);
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

  const signIn = useCallback(async (email, password) => {
    if (DEV_AUTH) return { data: null, error: null };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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

  const value = {
    session,
    user,
    profile,
    org,
    orgId: DEV_AUTH ? null : (org?.id ?? null),
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: DEV_AUTH ? true : !!session,
    role: profile?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
