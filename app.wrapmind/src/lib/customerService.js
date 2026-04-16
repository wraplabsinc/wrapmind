import { supabase } from './supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s) { return typeof s === 'string' && UUID_RE.test(s); }

function toSnakeCase(cust, orgId) {
  return {
    id: cust.id,
    org_id: orgId,
    name: cust.name,
    email: cust.email || null,
    phone: cust.phone || null,
    company: cust.company || null,
    address: cust.address && typeof cust.address === 'object'
      ? cust.address
      : {},
    tags: Array.isArray(cust.tags) ? cust.tags : [],
    source: cust.source || 'walk-in',
    assignee: cust.assignee || null,
    notes: cust.notes || null,
    status: cust.status || 'active',
    disc_profile: cust.discProfile || cust.disc_profile || null,
    created_at: cust.createdAt || new Date().toISOString(),
    last_activity_at: cust.lastActivityAt || null,
  };
}

function toCamelCase(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address || {},
    tags: row.tags || [],
    source: row.source,
    assignee: row.assignee,
    notes: row.notes || '',
    status: row.status,
    discProfile: row.disc_profile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
  };
}

const CAMEL_TO_SNAKE = {
  lastActivityAt: 'last_activity_at',
  discProfile: 'disc_profile',
};

export async function fetchCustomers(orgId) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function insertCustomer(cust, orgId) {
  const row = toSnakeCase(cust, orgId);
  const { data, error } = await supabase
    .from('customers')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function patchCustomer(id, patch) {
  const snakePatch = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id' || k === 'orgId' || k === 'createdAt' || k === 'updatedAt') continue;
    const snakeKey = CAMEL_TO_SNAKE[k] || k;
    snakePatch[snakeKey] = v;
  }
  if (Object.keys(snakePatch).length === 0) return;
  const { error } = await supabase.from('customers').update(snakePatch).eq('id', id);
  if (error) throw error;
}

export async function removeCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

export async function migrateLocalCustomers(localCustomers, orgId) {
  const existing = await fetchCustomers(orgId);
  const existingNames = new Set(existing.map(c => c.name?.toLowerCase()));

  const newCustomers = localCustomers.filter(
    c => c.name && !existingNames.has(c.name.toLowerCase())
  );
  if (newCustomers.length === 0) return existing;

  const rows = newCustomers.map(c => {
    const row = toSnakeCase(c, orgId);
    if (!isUUID(row.id)) row.id = crypto.randomUUID();
    return row;
  });

  const { data, error } = await supabase.from('customers').insert(rows).select();
  if (error) throw error;
  return [...existing, ...(data || []).map(toCamelCase)];
}

// ─── Communications ──────────────────────────────────────────────────────────

function commToSnakeCase(entry, orgId, customerId) {
  return {
    id: entry.id && isUUID(entry.id) ? entry.id : crypto.randomUUID(),
    org_id: orgId,
    customer_id: customerId,
    type: entry.type,
    direction: entry.direction,
    content: entry.content || null,
    sent_by: entry.sentBy || null,
    created_at: entry.at || entry.createdAt || new Date().toISOString(),
  };
}

function commToCamelCase(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    direction: row.direction,
    content: row.content,
    sentBy: row.sent_by,
    at: row.created_at,
  };
}

export async function fetchCommunications(customerId) {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(commToCamelCase);
}

export async function fetchAllCommunications(orgId) {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(commToCamelCase);
}

export async function insertCommunication(entry, orgId, customerId) {
  const row = commToSnakeCase(entry, orgId, customerId);
  const { data, error } = await supabase
    .from('communications')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return commToCamelCase(data);
}

export async function migrateLocalCommunications(entries, orgId, customerIdMap) {
  if (!entries || entries.length === 0) return;
  const rows = entries
    .filter(e => e.customerId && customerIdMap[e.customerId])
    .map(e => commToSnakeCase(e, orgId, customerIdMap[e.customerId]));
  if (rows.length === 0) return;
  const { error } = await supabase.from('communications').insert(rows);
  if (error) throw error;
}
