const { supabaseAdmin } = require('../config/database');

async function exportEstimates(req, res) {
  try {
    const { format = 'csv', status, date_from, date_to } = req.query;

    let query = supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('org_id', req.user.org_id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data: estimates, error } = await query;

    if (error) throw error;

    if (format === 'json') {
      res.set('Content-Type', 'application/json');
      res.set('Content-Disposition', 'attachment; filename="estimates.json"');
      return res.json(estimates);
    }

    if (estimates.length === 0) {
      res.set('Content-Type', 'text/csv');
      return res.send('');
    }

    const headers = Object.keys(estimates[0]).filter(
      (k) => !['line_items_json', 'vehicle_json', 'details_json', 'client_json'].includes(k)
    );

    const csvRows = [
      headers.join(','),
      ...estimates.map((e) =>
        headers
          .map((h) => {
            const val = e[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="estimates.csv"');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
}

module.exports = { exportEstimates };
