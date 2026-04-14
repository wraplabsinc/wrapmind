const aiService = require('../services/aiService');

async function analyzeVision(req, res) {
  try {
    const { photos } = req.body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Photos array is required' });
    }

    const result = await aiService.analyzeVision(photos);

    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: 'Vision analysis failed', details: err.message });
  }
}

module.exports = { analyzeVision };
