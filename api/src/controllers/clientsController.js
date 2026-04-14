const { supabaseAdmin } = require('../config/database');

async function listClients(req, res) {
  try {
    const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('org_id', req.user.org_id)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      clients: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list clients', details: err.message });
  }
}

async function createClient(req, res) {
  try {
    const { email, phone } = req.body;

    if (email || phone) {
      let existingQuery = supabaseAdmin
        .from('clients')
        .select('id')
        .eq('org_id', req.user.org_id);

      if (email) existingQuery = existingQuery.eq('email', email);
      else if (phone) existingQuery = existingQuery.eq('phone', phone);

      const { data: existing } = await existingQuery.single();

      if (existing) {
        return res.status(409).json({ error: 'Client already exists', clientId: existing.id });
      }
    }

    const clientData = { ...req.body, org_id: req.user.org_id };

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ client });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client', details: err.message });
  }
}

async function updateClient(req, res) {
  try {
    const { id } = req.params;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .select()
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client', details: err.message });
  }
}

async function getClient(req, res) {
  try {
    const { id } = req.params;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { data: jobHistory } = await supabaseAdmin
      .from('estimates')
      .select('id, estimate_id, status, vehicle_json, created_at, total')
      .eq('client_id', id)
      .eq('org_id', req.user.org_id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    res.json({ client, jobHistory: jobHistory || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client', details: err.message });
  }
}

module.exports = { listClients, createClient, updateClient, getClient };
