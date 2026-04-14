const { supabaseAdmin } = require('../config/database');
const shopmonkeyService = require('../services/shopmonkeyService');

async function getSettings(req, res) {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('shop_settings')
      .select('*')
      .eq('org_id', req.user.org_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ settings: settings || {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
}

async function updateSettings(req, res) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('shop_settings')
      .select('id')
      .eq('org_id', req.user.org_id)
      .single();

    let result;

    if (existing) {
      result = await supabaseAdmin
        .from('shop_settings')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('org_id', req.user.org_id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('shop_settings')
        .insert({ ...req.body, org_id: req.user.org_id })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json({ settings: result.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
}

async function syncShopmonkey(req, res) {
  try {
    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('shopmonkey_token')
      .eq('org_id', req.user.org_id)
      .single();

    if (!settings?.shopmonkey_token) {
      return res.status(400).json({ error: 'Shopmonkey token not configured' });
    }

    const token = settings.shopmonkey_token;

    const [laborRates, workflowStatuses, users, shopInfo] = await Promise.all([
      shopmonkeyService.getLaborRates(token),
      shopmonkeyService.getWorkflowStatuses(token),
      shopmonkeyService.getUsers(token),
      shopmonkeyService.getShopInfo(token),
    ]);

    await supabaseAdmin
      .from('shop_settings')
      .update({
        labor_rates_json: laborRates,
        workflow_statuses_json: workflowStatuses,
        sm_users_json: users,
        shop_info_json: shopInfo,
        last_sm_sync: new Date().toISOString(),
      })
      .eq('org_id', req.user.org_id);

    res.json({
      message: 'Shopmonkey sync complete',
      laborRates: laborRates?.length || 0,
      workflowStatuses: workflowStatuses?.length || 0,
      users: users?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync Shopmonkey', details: err.message });
  }
}

module.exports = { getSettings, updateSettings, syncShopMonkey: syncShopmonkey };
