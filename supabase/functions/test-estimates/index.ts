import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_ESTIMATES } from './seed/seed_estimates.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_ESTIMATES.length }));
});
