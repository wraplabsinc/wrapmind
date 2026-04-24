import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nbewyeoiizlsfmbqoist.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyZWYiOiJ3cmFwbWluZCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxNzc2NDU0MzY1fQ.QPtw6xT3fRzuTxfdn7CWsMeotxpIViddPJYAxSwHqYY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const config = {
  projectUrl: supabaseUrl,
};

export default supabase;