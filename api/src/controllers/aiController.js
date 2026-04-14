const aiService = require('../services/aiService');
const pricingEngine = require('../utils/pricingEngine');
const confidenceEngine = require('../utils/confidenceEngine');

async function generateEstimate(req, res) {
  try {
    const { prompt, vision, details } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiResult = await aiService.generateEstimate(prompt);

    const pricing = pricingEngine.calculatePricing(aiResult.line_items || [], req.user.settings);
    const confidence = confidenceEngine.calculateConfidence(vision, details);

    res.json({
      estimate: { ...aiResult, ...pricing },
      confidence,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate estimate', details: err.message });
  }
}

module.exports = { generateEstimate };
