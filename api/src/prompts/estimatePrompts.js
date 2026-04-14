function buildVisionPrompt() {
  return `You are a senior Wrap Labs technician performing a pre-job vehicle inspection. Analyze the provided vehicle photos and return ONLY valid JSON matching this exact schema. No prose, no markdown, no explanation text.

Required JSON schema:
{
  "year_make_model": "string - identified vehicle",
  "base_color": "string - OEM paint color",
  "paint_condition": "excellent | good | fair | poor",
  "chrome_level": "none | minimal | moderate | heavy",
  "chrome_inventory": ["array of specific chrome parts visible"],
  "blackout_candidates": ["array of parts suitable for blackout"],
  "existing_film": boolean,
  "existing_film_notes": "string or empty",
  "wheel_condition": "clean | dirty | damaged",
  "vehicle_dirty": boolean,
  "ppf_recommendation": "string - PPF recommendation if applicable",
  "technician_notes": "string - any relevant observations",
  "confidence_modifiers": {
    "photo_quality": "high | medium | low | none",
    "vehicle_identifiable": boolean,
    "chrome_complexity": "none | low | medium | high",
    "existing_film_detected": boolean,
    "paint_condition_clear": boolean
  }
}`;
}

function buildEstimatePrompt(context) {
  const {
    shopSettings,
    vehicle,
    services,
    details,
    visionReport,
    pricingRules,
    invoiceBenchmarks,
    topUpsells,
  } = context;

  return `You are WrapIQ's AI estimation engine for premium automotive customization shops. Generate a detailed, accurate estimate for the following job.

SHOP SETTINGS:
${JSON.stringify(shopSettings, null, 2)}

VEHICLE:
${JSON.stringify(vehicle, null, 2)}

SELECTED SERVICES:
${JSON.stringify(services, null, 2)}

DETAILS:
${JSON.stringify(details, null, 2)}

VISION ANALYSIS REPORT:
${JSON.stringify(visionReport, null, 2)}

PRICING RULES (ENFORCE ALL):
${JSON.stringify(pricingRules, null, 2)}

INVOICE BENCHMARKS:
${JSON.stringify(invoiceBenchmarks, null, 2)}

TOP CONVERTING UPSELLS:
${JSON.stringify(topUpsells, null, 2)}

Return ONLY valid JSON with these sections:
{
  "line_items": [
    {
      "service": "string",
      "type": "labor | material | fee | discount | surcharge",
      "description": "string",
      "labor_hours": number,
      "labor_rate": number,
      "labor_cost": number,
      "material_cost": number,
      "total": number,
      "is_rush": boolean,
      "taxable": boolean
    }
  ],
  "subtotal": number,
  "tax": number,
  "fees": [{ "description": string, "amount": number }],
  "discounts": [{ "description": string, "amount": number }],
  "deposit_amount": number,
  "timeline_estimate": { "min_days": number, "max_days": number, "notes": string },
  "upsell_suggestions": [
    { "service": string, "reason": string, "estimated_value": number }
  ],
  "technician_notes": "string",
  "confidence_modifiers": {
    "photo_quality": "high | medium | low | none",
    "vehicle_identifiable": boolean,
    "chrome_complexity": "none | low | medium | high",
    "existing_film_detected": boolean,
    "paint_condition_clear": boolean
  }
}`;
}

module.exports = { buildVisionPrompt, buildEstimatePrompt };
