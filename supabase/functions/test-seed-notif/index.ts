import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_NOTIFICATIONS } from '../../functions/seed-test-org/seed/seed_notifications.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_NOTIFICATIONS.length }));
});
