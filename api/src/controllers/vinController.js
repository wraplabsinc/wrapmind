const axios = require('axios');

async function decodeVIN(req, res) {
  try {
    const { vin } = req.query;

    if (!vin || vin.length !== 17) {
      return res.status(400).json({ error: 'Valid 17-character VIN required' });
    }

    const response = await axios.get(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    );

    const results = {};
    for (const item of response.data.Results) {
      if (item.Value && item.Value !== 'null') {
        results[item.Variable.replace(/\s+/g, '_').toLowerCase()] = item.Value;
      }
    }

    res.json({ vin, decoded: results });
  } catch (err) {
    res.status(500).json({ error: 'VIN decode failed', details: err.message });
  }
}

async function decodePlate(req, res) {
  try {
    const { plate, state } = req.query;

    if (!plate) {
      return res.status(400).json({ error: 'Plate number required' });
    }

    const result = { plate, state, vin: null, vehicle: null };

    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${result.vin || 'placeholder'}?format=json`
      );
      const firstValid = response.data.Results?.[0];
      if (firstValid && firstValid.Make) {
        result.vehicle = {
          make: firstValid.Make,
          model: firstValid.Model,
          year: firstValid.ModelYear,
          body_class: firstValid.BodyClass,
        };
      }
    } catch {
    }

    res.json({ plate: result });
  } catch (err) {
    res.status(500).json({ error: 'Plate decode failed', details: err.message });
  }
}

module.exports = { getVinInfo: decodeVIN, getPlateInfo: decodePlate };
