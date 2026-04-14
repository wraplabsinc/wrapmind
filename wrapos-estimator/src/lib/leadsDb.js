import supabase from './supabase';

// ─── Row <-> Lead object conversion ─────────────────────────────────────────
function rowToLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    vehicle: {
      year: row.vehicle_year || null,
      make: row.vehicle_make || '',
      model: row.vehicle_model || '',
    },
    serviceInterest: row.service_interest || '',
    budget: row.budget != null ? Number(row.budget) : null,
    source: row.source || 'manual',
    status: row.status || 'new',
    priority: row.priority || 'warm',
    assignee: row.assignee || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || '',
    followUpDate: row.follow_up_date || null,
    createdAt: row.created_at || new Date().toISOString(),
    lastContactedAt: row.last_contacted_at || null,
    activities: Array.isArray(row.activities) ? row.activities : [],
  };
}

function leadToRow(lead, orgId) {
  return {
    org_id: orgId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    vehicle_year: lead.vehicle?.year || null,
    vehicle_make: lead.vehicle?.make || null,
    vehicle_model: lead.vehicle?.model || null,
    service_interest: lead.serviceInterest || null,
    budget: lead.budget || null,
    source: lead.source || 'manual',
    status: lead.status || 'new',
    priority: lead.priority || 'warm',
    assignee: lead.assignee || null,
    tags: Array.isArray(lead.tags) ? lead.tags : [],
    notes: lead.notes || null,
    follow_up_date: lead.followUpDate || null,
    last_contacted_at: lead.lastContactedAt || null,
    activities: lead.activities || [],
    metadata: {},
  };
}

// ─── CRUD ───────────────────────────────────────────────────────────────────
export async function fetchLeads(orgId) {
  try {
    const query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (orgId) query.eq('org_id', orgId);
    const { data, error } = await query;
    if (error) {
      console.warn('[leadsDb] fetchLeads error:', error.message);
      return [];
    }
    return (data || []).map(rowToLead);
  } catch (e) {
    console.warn('[leadsDb] fetchLeads exception:', e);
    return [];
  }
}

export async function insertLead(lead, orgId) {
  try {
    const row = leadToRow(lead, orgId);
    const { data, error } = await supabase
      .from('leads')
      .insert([row])
      .select()
      .single();
    if (error) {
      console.warn('[leadsDb] insertLead error:', error.message);
      return null;
    }
    return rowToLead(data);
  } catch (e) {
    console.warn('[leadsDb] insertLead exception:', e);
    return null;
  }
}

export async function updateLead(id, updates, orgId) {
  try {
    const row = leadToRow({ ...updates, id }, orgId);
    delete row.org_id;
    const query = supabase
      .from('leads')
      .update(row)
      .eq('id', id);
    if (orgId) query.eq('org_id', orgId);
    const { data, error } = await query.select().single();
    if (error) {
      console.warn('[leadsDb] updateLead error:', error.message);
      return null;
    }
    return rowToLead(data);
  } catch (e) {
    console.warn('[leadsDb] updateLead exception:', e);
    return null;
  }
}

export async function deleteLead(id, orgId) {
  try {
    const query = supabase.from('leads').delete().eq('id', id);
    if (orgId) query.eq('org_id', orgId);
    const { error } = await query;
    if (error) {
      console.warn('[leadsDb] deleteLead error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[leadsDb] deleteLead exception:', e);
    return false;
  }
}

// Subscribe to realtime INSERT events on the leads table.
// When orgId is provided, only receives inserts for that org.
export function subscribeToNewLeads(onNewLead, onStatusChange, orgId) {
  const channelConfig = {
    event: 'INSERT',
    schema: 'public',
    table: 'leads',
  };
  if (orgId) channelConfig.filter = `org_id=eq.${orgId}`;

  const channel = supabase
    .channel('leads-realtime')
    .on('postgres_changes', channelConfig, (payload) => {
      try {
        onNewLead?.(rowToLead(payload.new));
      } catch (e) {
        console.warn('[leadsDb] onNewLead handler error:', e);
      }
    })
    .subscribe((status) => {
      onStatusChange?.(status);
    });
  return () => {
    try {
      supabase.removeChannel(channel);
    } catch { /* ignore */ }
  };
}

// Push a test lead directly to Supabase to demo the realtime feature.
export async function pushTestLead(orgId) {
  const sampleNames = [
    { name: 'Alex Rodriguez',  vehicle: { year: 2024, make: 'Tesla',   model: 'Model S' }, service: 'Color Change – Satin Black' },
    { name: 'Jamie Kim',       vehicle: { year: 2023, make: 'Porsche', model: '911' },    service: 'Full Vehicle PPF' },
    { name: 'Morgan Avery',    vehicle: { year: 2024, make: 'BMW',     model: 'M4' },     service: 'XPEL Stealth Full Front' },
    { name: 'Taylor Brooks',   vehicle: { year: 2022, make: 'Audi',    model: 'RS6' },    service: 'Partial Wrap' },
  ];
  const pick = sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const phone = `(${200 + Math.floor(Math.random() * 700)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`;
  const email = pick.name.toLowerCase().replace(/\s+/g, '.') + '@test.io';

  const lead = {
    name: pick.name,
    phone,
    email,
    vehicle: pick.vehicle,
    serviceInterest: pick.service,
    budget: 2000 + Math.floor(Math.random() * 14000),
    source: 'zapier',
    status: 'new',
    priority: 'warm',
    assignee: null,
    tags: [],
    notes: 'Test lead pushed from the Import modal.',
    followUpDate: null,
    lastContactedAt: null,
    activities: [
      { type: 'created', text: 'Test lead created via Supabase push', at: new Date().toISOString() },
    ],
  };
  return insertLead(lead, orgId);
}
