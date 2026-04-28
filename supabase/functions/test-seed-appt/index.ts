import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_APPOINTMENTS } from '../../functions/seed-test-org/seed/seed_appointments.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_APPOINTMENTS.length }));
});
