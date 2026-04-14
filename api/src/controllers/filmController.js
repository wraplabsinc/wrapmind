const filmCalculator = require('../utils/filmCalculator');
const { supabaseAdmin } = require('../config/database');
const pdfService = require('../services/pdfService');

async function calculateFilm(req, res) {
  try {
    const { vehicle_class, services } = req.body;

    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('film_prefs_json')
      .eq('org_id', req.user.org_id)
      .single();

    const result = filmCalculator.calculateFilmRequirements(vehicle_class, services, settings);

    res.json({ film: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate film', details: err.message });
  }
}

async function getSupplierSheet(req, res) {
  try {
    const { vehicle_class, services, format = 'text' } = req.query;

    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('film_prefs_json, shop_name')
      .eq('org_id', req.user.org_id)
      .single();

    const filmResult = filmCalculator.calculateFilmRequirements(vehicle_class, JSON.parse(services || '[]'), settings);

    if (format === 'pdf') {
      const pdfBuffer = await pdfService.generateSupplierSheet(filmResult, settings);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="supplier-order.pdf"',
      });
      return res.send(pdfBuffer);
    }

    const lines = [
      `Supplier Order Sheet - ${settings?.shop_name || 'WrapIQ'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      `Vehicle Class: ${vehicle_class}`,
      `Total Linear Feet: ${filmResult.linear_feet.toFixed(1)}`,
      `Yards to Order: ${filmResult.yards_to_order}`,
      '',
      'Film Options:',
      ...filmResult.film_options.map((f) =>
        `  - ${f.brand} ${f.product_name} (${f.roll_width}" roll): $${f.cost_per_yard.toFixed(2)}/yd = $${f.total_material_cost.toFixed(2)}`
      ),
      '',
      'Addons:',
      ...filmResult.addons.map((a) => `  - ${a.item}: ${a.footage || a.note}`),
    ];

    res.set('Content-Type', 'text/plain');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate supplier sheet', details: err.message });
  }
}

module.exports = { calculateFilm, getSupplierSheet };
