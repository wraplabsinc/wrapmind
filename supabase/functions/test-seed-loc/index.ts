import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_LOCATIONS } from '../../functions/seed-test-org/seed/seed_locations.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_LOCATIONS.length }));
});
