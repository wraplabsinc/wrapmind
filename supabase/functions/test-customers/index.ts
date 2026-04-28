import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_CUSTOMERS } from './seed/seed_customers.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_CUSTOMERS.length }));
});
