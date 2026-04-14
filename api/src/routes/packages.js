const { Router } = require('express');
const { supabaseAnon } = require('../config/database');
const { requireApiKey } = require('../middleware/apiKeyAuth');

const router = Router();
router.use(requireApiKey);

// GET /packages
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAnon.rpc('get_available_packages', {});
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /packages/calculate-price
router.post('/calculate-price', async (req, res, next) => {
  try {
    const { package_id, car_id, material_id } = req.body;

    if (!package_id) {
      return res.status(400).json({ error: 'package_id is required' });
    }
    if (!car_id) {
      return res.status(400).json({ error: 'car_id is required' });
    }

    const { data, error } = await supabaseAnon.rpc('calculate_package_price', {
      p_package_id: package_id,
      p_car_id: car_id,
      p_material_id: material_id || null,
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
