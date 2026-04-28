import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SEED_GAMIFICATION_EVENTS } from './seed/seed_gamification_events.js';

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, count: SEED_GAMIFICATION_EVENTS.length }));
});
