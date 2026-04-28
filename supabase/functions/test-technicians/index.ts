import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_TECHNICIANS } from './seed/seed_technicians.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_TECHNICIANS.length }));
});
