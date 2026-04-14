const { supabaseAdmin } = require('../config/database');

async function submitLead(req, res) {
  try {
    const leadData = {
      ...req.body,
      status: 'new',
    };

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit lead', details: err.message });
  }
}

async function listLeads(req, res) {
  try {
    const { page = 1, limit = 20, status, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('org_id', req.user.org_id)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      leads: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list leads', details: err.message });
  }
}

async function getLead(req, res) {
  try {
    const { id } = req.params;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead', details: err.message });
  }
}

async function convertLead(req, res) {
  try {
    const { id } = req.params;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const clientData = {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      org_id: req.user.org_id,
    };

    const { data: client } = await supabaseAdmin
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    await supabaseAdmin
      .from('leads')
      .update({ status: 'converted', converted_to_client_id: client?.id })
      .eq('id', id);

    res.json({ message: 'Lead converted', client, lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert lead', details: err.message });
  }
}

async function updateLeadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .select()
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead status', details: err.message });
  }
}

module.exports = { submitIntake: submitLead, listLeads, getLead, convertLead, updateLeadStatus };
