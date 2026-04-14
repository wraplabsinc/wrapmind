const { supabaseAdmin } = require('../config/database');

async function globalSearch(req, res) {
  try {
    const { q, type, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = { estimates: [], clients: [], vehicles: [], leads: [] };

    if (!type || type === 'estimates') {
      const { data: estimates } = await supabaseAdmin
        .from('estimates')
        .select('id, estimate_id, status, vehicle_json, client_id, created_at')
        .eq('org_id', req.user.org_id)
        .eq('archived', false)
        .ilike('estimate_id', `%${q}%`)
        .limit(parseInt(limit));

      results.estimates = estimates || [];
    }

    if (!type || type === 'clients') {
      const { data: clients } = await supabaseAdmin
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .eq('org_id', req.user.org_id)
        .or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        )
        .limit(parseInt(limit));

      results.clients = clients || [];
    }

    if (!type || type === 'vehicles') {
      const { data: estimates } = await supabaseAdmin
        .from('estimates')
        .select('id, estimate_id, vehicle_json, client_id')
        .eq('org_id', req.user.org_id)
        .eq('archived', false)
        .ilike('vehicle_json::text', `%${q}%`)
        .limit(parseInt(limit));

      results.vehicles = (estimates || []).map((e) => ({
        estimate_id: e.estimate_id,
        vehicle: e.vehicle_json,
        client_id: e.client_id,
      }));
    }

    if (!type || type === 'leads') {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id, first_name, last_name, email, phone, status, vehicle_info')
        .eq('org_id', req.user.org_id)
        .or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        )
        .limit(parseInt(limit));

      results.leads = leads || [];
    }

    res.json({ results, query: q });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
}

module.exports = { search: globalSearch };
