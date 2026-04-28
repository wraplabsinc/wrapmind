import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_LOCATIONS } from '../../functions/seed-test-org/seed/seed_locations.js';
import { SEED_CUSTOMERS } from '../../functions/seed-test-org/seed/seed_customers.js';
import { SEED_APPOINTMENTS } from '../../functions/seed-test-org/seed/seed_appointments.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, countL: SEED_LOCATIONS.length, countC: SEED_CUSTOMERS.length, countA: SEED_APPOINTMENTS.length }));
});
