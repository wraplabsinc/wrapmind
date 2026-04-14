const { Router } = require('express');
const { supabaseAnon } = require('../config/database');
const { requireApiKey } = require('../middleware/apiKeyAuth');

const router = Router();
router.use(requireApiKey);

// GET /vehicle/years
router.get('/years', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAnon.rpc('get_vehicle_years');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /vehicle/makes?year=
router.get('/makes', async (req, res, next) => {
  try {
    const { year } = req.query;
    const { data, error } = await supabaseAnon.rpc('get_vehicle_makes', { p_year: parseInt(year) });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /vehicle/models?year=&make=
router.get('/models', async (req, res, next) => {
  try {
    const { year, make } = req.query;
    const { data, error } = await supabaseAnon.rpc('get_vehicle_models', {
      p_year: parseInt(year),
      p_make: make,
    });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /vehicle/trims?year=&make=&model=
router.get('/trims', async (req, res, next) => {
  try {
    const { year, make, model } = req.query;
    const { data, error } = await supabaseAnon.rpc('get_vehicle_trims', {
      p_year: parseInt(year),
      p_make: make,
      p_model: model,
    });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /vehicle/find-by-ymmt
router.post('/find-by-ymmt', async (req, res, next) => {
  try {
    const { year, make, model, trim } = req.body;
    const { data, error } = await supabaseAnon.rpc('find_car_by_ymmt', {
      p_year: parseInt(year),
      p_make: make,
      p_model: model,
      p_trim: trim,
    });
    if (error) throw error;
    // RPC returns table, pick first row
    const car = Array.isArray(data) ? data[0] : data;
    res.json(car || null);
  } catch (err) {
    next(err);
  }
});

// POST /vehicle/find-by-vin
router.post('/find-by-vin', async (req, res, next) => {
  try {
    const { vin } = req.body;
    if (!vin || vin.length !== 17) {
      return res.status(400).json({ error: 'Valid 17-character VIN required' });
    }
    const { data, error } = await supabaseAnon.rpc('find_car_by_vin', { p_vin: vin });
    if (error) throw error;
    const car = Array.isArray(data) ? data[0] : data;
    res.json(car || null);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
