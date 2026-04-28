import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_LOCATIONS } from '../../functions/seed-test-org/seed/seed_locations.js';
import { SEED_CUSTOMERS } from '../../functions/seed-test-org/seed/seed_customers.js';
import { SEED_APPOINTMENTS } from '../../functions/seed-test-org/seed/seed_appointments.js';
import { SEED_LEADS } from '../../functions/seed-test-org/seed/seed_leads.js';
import { SEED_NOTIFICATIONS } from '../../functions/seed-test-org/seed/seed_notifications.js';

serve(async (req) => {
  return new Response(JSON.stringify({
    ok: true,
    l: SEED_LOCATIONS.length,
    c: SEED_CUSTOMERS.length,
    a: SEED_APPOINTMENTS.length,
    ld: SEED_LEADS.length,
    n: SEED_NOTIFICATIONS.length
  }));
});
