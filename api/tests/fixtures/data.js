const validUser = {
  id: 'test-user-uuid',
  email: 'test@wraplabs.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'owner',
  org_id: 'test-org-uuid',
};

const validVehicle = {
  year: 2024,
  make: 'Porsche',
  model: '911 Carrera S',
  color: 'GT Silver',
  size_class: 'sportsCoupe',
  complexity_tier: 'B',
};

const validServices = [
  { name: 'Full Color Change Wrap', film: 'Inozetek DOD200' },
];

const validDetails = {
  complexity_flags: ['door_jambs'],
  timeline: 'rush',
  referral_source: 'instagram',
  notes: 'Test notes',
};

const validVisionReport = {
  paint_condition: 'excellent',
  chrome_level: 'minimal',
  existing_film: false,
  vehicle_dirty: false,
  confidence_modifiers: {
    photo_quality: 'high',
    vehicle_identifiable: true,
    chrome_complexity: 'low',
    existing_film_detected: false,
    paint_condition_clear: true,
  },
};

const validLineItems = [
  {
    service: 'Full Color Change Wrap',
    type: 'labor',
    labor_hours: 40,
    labor_rate: 125,
    labor_cost: 5000,
    total: 5000,
  },
  {
    service: 'Film Material',
    type: 'material',
    material_cost: 2800,
    total: 2800,
  },
];

const validEstimate = {
  id: 'est-uuid-001',
  estimate_id: 'WL-2024-0001',
  org_id: 'test-org-uuid',
  writer_id: 'test-user-uuid',
  client_id: 'client-uuid-001',
  vehicle_json: validVehicle,
  services_json: validServices,
  details_json: validDetails,
  vision_json: validVisionReport,
  line_items_json: validLineItems,
  subtotal: 7800,
  tax: 565.5,
  fees: { shop_supplies: 390, cc_fee: 0 },
  discounts: { referral_discount: 500 },
  total: 8255.5,
  deposit_amount: 4127.75,
  timeline_estimate: { days: 7, rush: true },
  status: 'draft',
  archived: false,
  pushed_to_sm: false,
  approval_token: 'abc123token',
  created_at: '2024-01-15T10:00:00.000Z',
  updated_at: '2024-01-15T10:00:00.000Z',
};

const validClient = {
  id: 'client-uuid-001',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+18055551234',
  email: 'john@example.com',
  preferred_contact: 'text',
  referral_source: 'instagram',
  org_id: 'test-org-uuid',
};

const validSettings = {
  id: 'settings-uuid-001',
  org_id: 'test-org-uuid',
  shop_name: 'Wrap Labs Pro',
  shop_phone: '+18055559999',
  shop_address: '123 Wrap St, CA 90210',
  labor_rate_general: 125,
  labor_rate_ppf: 195,
  tax_rate: 7.25,
  shop_supplies_pct: 5,
  cc_fee_pct: 3.5,
  deposit_pct: 50,
  quote_expiry_days: 14,
  rush_multiplier: 1.2,
  shopmonkey_token: 'sm-token-123',
  film_prefs_json: { preferred_brand: 'Inozetek', preferred_finish: 'satin' },
  labor_rates_json: [{ id: 'lr1', name: 'Wrap', rate: 125 }],
  workflow_statuses_json: [{ id: 'ws1', name: 'New' }],
  sm_users_json: [{ id: 'u1', name: 'Admin' }],
  shop_info_json: { name: 'Wrap Labs' },
  last_sm_sync: '2024-01-15T10:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-15T10:00:00.000Z',
};

const validLead = {
  id: 'lead-uuid-001',
  first_name: 'Mike',
  last_name: 'Johnson',
  phone: '+18055554321',
  email: 'mike@example.com',
  year: 2024,
  make: 'BMW',
  model: 'M4',
  services_requested: ['Full Color Change Wrap', 'Window Tint'],
  status: 'new',
  org_id: 'test-org-uuid',
  created_at: '2024-01-15T10:00:00.000Z',
};

module.exports = {
  validUser,
  validVehicle,
  validServices,
  validDetails,
  validVisionReport,
  validLineItems,
  validEstimate,
  validClient,
  validSettings,
  validLead,
};
