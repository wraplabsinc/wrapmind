function createMockAnthropicResponse(text) {
  return {
    content: [{ text: text || JSON.stringify({
      line_items: [
        { service: 'Full Color Change Wrap', type: 'labor', labor_hours: 40, labor_rate: 125, labor_cost: 5000, material_cost: 0, total: 5000 },
        { service: 'Film Material', type: 'material', labor_hours: 0, labor_rate: 0, labor_cost: 0, material_cost: 2800, total: 2800 },
      ],
      subtotal: 7800,
      tax: 565.5,
      fees: { shop_supplies: 390, cc_fee: 0 },
      discounts: { referral_discount: 500 },
      total: 8255.5,
      deposit_amount: 4127.75,
      timeline_estimate: { days: 7, rush: true },
      upsell_suggestions: ['PPF front end', 'Ceramic coating'],
      technician_notes: 'Standard color change wrap',
      confidence_modifiers: { photo_quality: 'high' },
    }) }],
  };
}

function createMockAnthropicClient(responseText) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue(createMockAnthropicResponse(responseText)),
    },
  };
}

function resetMockAnthropic() {
  jest.clearAllMocks();
}

function setAnthropicResponse(text) {
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic();
  anthropic.messages.create.mockResolvedValue(createMockAnthropicResponse(text));
}

module.exports = { createMockAnthropicResponse, createMockAnthropicClient, resetMockAnthropic, setAnthropicResponse };
