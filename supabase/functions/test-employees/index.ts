import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_EMPLOYEES } from './seed/seed_employees.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_EMPLOYEES.length }));
});
