/**
 * userPreferences.js
 *
 * Persists per-role UI preferences to Supabase so settings survive
 * localStorage clears, device switches, and fresh logins.
 *
 * Table: user_preferences
 *   role          text  PRIMARY KEY
 *   dashboard_mode text
 *   updated_at    timestamptz
 *
 * SQL to create (run once in Supabase SQL editor):
 *
 *   create table if not exists user_preferences (
 *     role           text primary key,
 *     dashboard_mode text default 'essentials',
 *     updated_at     timestamptz default now()
 *   );
 *   alter table user_preferences enable row level security;
 *   create policy "allow_all_anon" on user_preferences
 *     for all using (true) with check (true);
 */

import supabase from './supabase';

const TABLE = 'user_preferences';

/**
 * Load a single preference value for a role.
 * Returns `fallback` if the row or column doesn't exist, or on any error.
 */
export async function loadPref(role, key, fallback = null) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(key)
      .eq('role', role)
      .maybeSingle();
    if (error || !data) return fallback;
    return data[key] ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Upsert a single preference value for a role.
 * Silently swallows errors — localStorage is the fallback layer.
 */
export async function savePref(role, key, value) {
  try {
    await supabase
      .from(TABLE)
      .upsert(
        { role, [key]: value, updated_at: new Date().toISOString() },
        { onConflict: 'role' }
      );
  } catch (e) {
    console.warn('[userPreferences] savePref failed:', e);
  }
}
