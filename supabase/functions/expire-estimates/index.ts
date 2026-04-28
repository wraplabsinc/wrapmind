// =============================================================================
// Expire Estimates — Automated Expiry Tracking
// Scheduled function: runs periodically to mark past-due estimates as expired
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req: Request) => {
  // Only allow POST (Supabase internal trigger)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  // 1. Fetch estimates that are candidates for expiration:
  //    - expires_at < now (past due)
  //    - status in ('draft', 'sent', 'approved', 'declined') — any non-terminal status
  const { data: candidates, error: fetchErr } = await supabase
    .from('estimates')
    .select('id')
    .lt('expires_at', now)
    .in('status', ['draft', 'sent', 'approved', 'declined']);

  if (fetchErr) {
    console.error('[expire-estimates] fetch error:', fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ message: 'No estimates require expiration.', expiredCount: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ids = candidates.map((row) => row.id);

  // 2. Bulk update: set status='expired' and update expires_at to timestamp of expiry
  const { error: updateErr } = await supabase
    .from('estimates')
    .update({ status: 'expired', expires_at: now })
    .in('id', ids);

  if (updateErr) {
    console.error('[expire-estimates] update error:', updateErr);
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Estimates expired successfully.', expiredCount: ids.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
