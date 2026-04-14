const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

let anthropic = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return anthropic;
}

async function analyzeVision(photos) {
  const client = getAnthropic();
  const systemPrompt = `You are a senior Wrap Labs technician performing a pre-job vehicle inspection. Analyze the provided vehicle photos and return ONLY valid JSON matching the required schema. No prose, no markdown, no explanation text.`;

  const userContent = [
    {
      type: 'text',
      text: 'Analyze these vehicle photos and return the inspection results as JSON.',
    },
    ...photos.map((photoUrl) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: photoUrl.media_type || 'image/jpeg',
        data: photoUrl.data,
      },
    })),
  ];

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Vision analysis did not return valid JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

async function generateEstimate(prompt) {
  const systemPrompt = `You are WrapIQ's AI estimation engine for premium automotive customization shops. Generate detailed, accurate estimates following all pricing rules provided. Return ONLY valid JSON with labeled sections: line_items (array with service, type, labor_hours, labor_cost, material_cost, total), subtotal, tax, fees, discounts, deposit_amount, timeline_estimate, upsell_suggestions, technician_notes, and confidence_modifiers. No prose, no markdown.`;

  const response = await getAnthropic().messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Estimate generation did not return valid JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeVision, generateEstimate };
