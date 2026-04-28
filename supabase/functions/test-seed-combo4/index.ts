import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_LOCATIONS } from '../../functions/seed-test-org/seed/seed_locations.js';
import { SEED_CUSTOMERS } from '../../functions/seed-test-org/seed/seed_customers.js';
import { SEED_EMPLOYEES } from '../../functions/seed-test-org/seed/seed_employees.js';
import { SEED_VEHICLES } from '../../functions/seed-test-org/seed/seed_vehicles.js';
import { SEED_ESTIMATES } from '../../functions/seed-test-org/seed/seed_estimates.js';
import { SEED_INVOICES } from '../../functions/seed-test-org/seed/seed_invoices.js';
import { SEED_APPOINTMENTS } from '../../functions/seed-test-org/seed/seed_appointments.js';
import { SEED_LEADS } from '../../functions/seed-test-org/seed/seed_leads.js';
import { SEED_NOTIFICATIONS } from '../../functions/seed-test-org/seed/seed_notifications.js';
import { SEED_GAMIFICATION_EVENTS } from '../../functions/seed-test-org/seed/seed_gamification_events.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true }));
});
