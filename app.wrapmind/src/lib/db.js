import { supabase } from './supabase';

export function orgQuery(table) {
  return supabase.from(table);
}

export async function orgInsert(table, row, orgId) {
  if (!orgId) throw new Error(`orgInsert: orgId required for ${table}`);
  return supabase.from(table).insert({ ...row, org_id: orgId });
}

export async function orgUpdate(table, id, updates, orgId) {
  if (!orgId) throw new Error(`orgUpdate: orgId required for ${table}`);
  return supabase.from(table).update(updates).eq('id', id).eq('org_id', orgId);
}

export async function orgDelete(table, id, orgId) {
  if (!orgId) throw new Error(`orgDelete: orgId required for ${table}`);
  return supabase.from(table).delete().eq('id', id).eq('org_id', orgId);
}

export async function orgSelect(table, orgId, options = {}) {
  let query = supabase.from(table).select(options.select || '*').eq('org_id', orgId);
  if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  if (options.limit) query = query.limit(options.limit);
  if (options.filters) {
    for (const [col, val] of Object.entries(options.filters)) {
      query = query.eq(col, val);
    }
  }
  return query;
}
