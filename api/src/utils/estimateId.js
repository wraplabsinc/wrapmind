const { supabaseAdmin } = require('../config/database');
const config = require('../config');

async function generateEstimateId(orgId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePart = `${month}${day}`;

  const { data: settings } = await supabaseAdmin
    .from('shop_settings')
    .select('estimate_id_prefix')
    .eq('org_id', orgId)
    .single();

  const prefix = settings?.estimate_id_prefix || config.estimate.defaultPrefix;

  const { data: counter } = await supabaseAdmin.rpc('increment_estimate_counter', {
    p_org_id: orgId,
    p_date: `${year}-${month}-${day}`,
  });

  const sequence = String(counter || 1).padStart(4, '0');
  return `${prefix}-${year}-${datePart}-${sequence}`;
}

module.exports = { generateEstimateId };
