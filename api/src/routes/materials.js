const { Router } = require('express');
const { supabaseAnon } = require('../config/database');
const { requireApiKey } = require('../middleware/apiKeyAuth');

const router = Router();
router.use(requireApiKey);

// GET /materials?category=vinyl_cast
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const { data, error } = await supabaseAnon.rpc('get_wrap_materials', { p_category: category || null });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /materials/calculate
router.post('/calculate', async (req, res, next) => {
  try {
    const { car_id } = req.body;
    const { data, error } = await supabaseAnon.rpc('calculate_wrap_material', { p_car_id: car_id });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
