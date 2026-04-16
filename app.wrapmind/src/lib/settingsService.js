import { supabase } from './supabase';

export async function fetchSettings(orgId) {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('org_id', orgId);
  if (error) throw error;
  const map = {};
  (data || []).forEach(row => { map[row.key] = row.value; });
  return map;
}

export async function getSetting(orgId, key) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('org_id', orgId)
    .eq('key', key)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value ?? null;
}

export async function upsertSetting(orgId, key, value) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ org_id: orgId, key, value, updated_at: new Date().toISOString() }, {
      onConflict: 'org_id,key',
    })
    .select()
    .single();
  if (error) throw error;
  return data?.value;
}

export async function deleteSetting(orgId, key) {
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('org_id', orgId)
    .eq('key', key);
  if (error) throw error;
}
