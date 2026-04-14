const { supabaseAdmin } = require('../config/database');

async function getAnalytics(req, res) {
  try {
    const { data: upsellData } = await supabaseAdmin
      .from('upsells')
      .select('*')
      .eq('org_id', req.user.org_id);

    if (!upsellData) {
      return res.json({ analytics: { total: 0, presented: 0, accepted: 0, conversion_rate: 0, by_service: {} } });
    }

    const total = upsellData.length;
    const presented = upsellData.filter((u) => u.presented).length;
    const accepted = upsellData.filter((u) => u.accepted).length;
    const conversionRate = presented > 0 ? (accepted / presented) * 100 : 0;

    const byService = {};
    for (const item of upsellData) {
      const service = item.service_type || 'unknown';
      if (!byService[service]) {
        byService[service] = { presented: 0, accepted: 0 };
      }
      if (item.presented) byService[service].presented++;
      if (item.accepted) byService[service].accepted++;
    }

    for (const service of Object.keys(byService)) {
      const s = byService[service];
      s.conversion_rate = s.presented > 0 ? (s.accepted / s.presented) * 100 : 0;
    }

    res.json({
      analytics: {
        total,
        presented,
        accepted,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        by_service: byService,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
}

async function updateUpsell(req, res) {
  try {
    const { id } = req.params;
    const { presented, accepted } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (presented !== undefined) updateData.presented = presented;
    if (accepted !== undefined) updateData.accepted = accepted;

    const { data: upsell, error } = await supabaseAdmin
      .from('upsells')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', req.user.org_id)
      .select()
      .single();

    if (error || !upsell) {
      return res.status(404).json({ error: 'Upsell record not found' });
    }

    res.json({ upsell });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update upsell', details: err.message });
  }
}

module.exports = { getUpsellAnalytics: getAnalytics, updateUpsell };
