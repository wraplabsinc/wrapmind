const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apiEndpointPort: process.env.PORT || process.env.API_ENDPOINT_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: '24h',
  },

  shopmonkey: {
    baseUrl: 'https://api.shopmonkey.io',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  rateLimit: {
    aiGeneration: {
      windowMs: 60 * 60 * 1000,
      max: 60,
    },
    intakeForm: {
      windowMs: 60 * 60 * 1000,
      max: 5,
    },
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },

  estimate: {
    defaultPrefix: process.env.ESTIMATE_PREFIX || 'WL',
    defaultDepositPct: 50,
    defaultTaxRate: 7.25,
    defaultShopSuppliesPct: 5,
    defaultCCFeePct: 3.5,
    defaultQuoteExpiryDays: 14,
    defaultRushMultiplier: 1.2,
    defaultLaborRateGeneral: 125,
    defaultLaborRatePPF: 195,
    referralDiscount: 500,
    dirtyVehicleSurcharge: 150,
    chromeWrapFloorMinimum: 8500,
  },

  film: {
    wasteFactors: {
      standard: 0.12,
      chrome: 0.25,
      colorPPF: 0.15,
      specialty: 0.20,
    },
    exoticExtra: 0.05,
    rollWidthStandard: 60,
  },

  vehicleClasses: {
    compact: { rawFootage: 50.5, waste: 0.12 },
    sportsCoupe: { rawFootage: 46.0, waste: 0.15 },
    largeSedan: { rawFootage: 59.0, waste: 0.12 },
    midSUV: { rawFootage: 68.0, waste: 0.12 },
    fullSizeSUV: { rawFootage: 88.5, waste: 0.10 },
    exotic: { rawFootage: 48.5, waste: 0.20 },
    pickup: { rawFootage: 85.5, waste: 0.10 },
    van: { rawFootage: 105.5, waste: 0.10 },
  },

  apiKey: process.env.API_KEY || 'wrap-dev-12345678-abcdefghijklmnop',

  complexityTiers: {
    A: { label: 'Standard', multiplier: 1.0 },
    B: { label: 'Elevated', multiplier: 1.20 },
    C: { label: 'High', multiplier: 1.40 },
    D: { label: 'Bespoke', multiplier: null },
  },
};
