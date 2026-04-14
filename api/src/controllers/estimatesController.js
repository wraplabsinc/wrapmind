const { supabaseAdmin } = require('../config/database');
const aiService = require('../services/aiService');
const pricingEngine = require('../utils/pricingEngine');
const confidenceEngine = require('../utils/confidenceEngine');
const { generateEstimateId } = require('../utils/estimateId');
const shopmonkeyService = require('../services/shopmonkeyService');
const pdfService = require('../services/pdfService');
const crypto = require('crypto');

async function listEstimates(req, res) {
  try {
    const { page = 1, limit = 20, status, date_from, date_to, client_id, writer_id, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('estimates')
      .select('*', { count: 'exact' })
      .eq('archived', false)
      .eq('org_id', req.user.org_id)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    if (client_id) query = query.eq('client_id', client_id);
    if (writer_id) query = query.eq('writer_id', writer_id);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      estimates: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list estimates', details: err.message });
  }
}

async function getEstimate(req, res) {
  try {
    const { id } = req.params;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    res.json({ estimate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch estimate', details: err.message });
  }
}

async function generateEstimate(req, res) {
  try {
    const { vehicle, services, details, vision } = req.body;

    const prompt = JSON.stringify({ vehicle, services, details, vision });
    const aiResult = await aiService.generateEstimate(prompt);

    const pricing = pricingEngine.calculatePricing(aiResult.line_items || [], req.user.settings);
    const confidence = confidenceEngine.calculateConfidence(vision, details);

    res.json({
      estimate: { ...aiResult, ...pricing },
      confidence,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate estimate', details: err.message });
  }
}

async function createEstimate(req, res) {
  try {
    const estimateData = { ...req.body, org_id: req.user.org_id, writer_id: req.user.id };

    const estimateId = await generateEstimateId(req.user.org_id);
    estimateData.estimate_id = estimateId;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .insert(estimateData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ estimate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create estimate', details: err.message });
  }
}

async function updateEstimate(req, res) {
  try {
    const { id } = req.params;
    const { status, notes, signature, ...updates } = req.body;

    const updateData = { ...updates, updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (signature !== undefined) updateData.signature = signature;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .select()
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found or update failed' });
    }

    res.json({ estimate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update estimate', details: err.message });
  }
}

async function deleteEstimate(req, res) {
  try {
    const { id } = req.params;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .select()
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    res.json({ message: 'Estimate archived successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete estimate', details: err.message });
  }
}

async function pushToShopmonkey(req, res) {
  try {
    const { id } = req.params;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('*')
      .eq('org_id', req.user.org_id)
      .single();

    const result = await shopmonkeyService.pushEstimateToShopmonkey(
      settings?.shopmonkey_token,
      estimate,
      settings
    );

    if (result.success) {
      await supabaseAdmin
        .from('estimates')
        .update({ shopmonkey_order_id: result.orderId, pushed_to_sm: true })
        .eq('id', id);
    }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to push to Shopmonkey', details: err.message });
  }
}

async function getEstimatePDF(req, res) {
  try {
    const { id } = req.params;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const pdfBuffer = await pdfService.generateEstimatePDF(estimate);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${estimate.estimate_id}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
}

async function approveEstimate(req, res) {
  try {
    const { id } = req.params;
    const { token, signature, client_name } = req.body;

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    if (estimate.approval_token && estimate.approval_token !== token) {
      return res.status(403).json({ error: 'Invalid approval token' });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: client_name,
        client_signature: signature,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ estimate: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve estimate', details: err.message });
  }
}

async function getEstimateNotes(req, res) {
  try {
    const { id } = req.params;

    const { data: notes, error } = await supabaseAdmin
      .from('estimate_notes')
      .select('*')
      .eq('estimate_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
}

async function addEstimateNote(req, res) {
  try {
    const { id } = req.params;
    const { content, is_internal } = req.body;

    const { data: note, error } = await supabaseAdmin
      .from('estimate_notes')
      .insert({
        estimate_id: id,
        user_id: req.user.id,
        content,
        is_internal: is_internal !== false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note', details: err.message });
  }
}

module.exports = {
  listEstimates,
  getEstimate,
  generateEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  pushShopMonkey: pushToShopmonkey,
  getEstimatePdf: getEstimatePDF,
  approveEstimate,
  getEstimateNotes,
  createEstimateNote: addEstimateNote,
};
