// Integration test endpoint for external services
// Verifies credentials for ShopMonkey, Slack, Carfax, and Stripe
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integration, credentials } = await req.json()

    // Verify JWT from frontend
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return json(401, { success: false, message: 'Unauthorized' }, corsHeaders)
    }

    switch (integration) {
      case 'stripe':
        return await testStripe(credentials)
      case 'slack':
        return await testSlack(credentials)
      case 'shopmonkey':
        return await testShopMonkey(credentials)
      case 'carfax':
        return await testCarfax(credentials)
      default:
        return json(400, { success: false, message: `Unknown integration: ${integration}` }, corsHeaders)
    }
  } catch (err: any) {
    console.error('Integration test error:', err)
    return json(500, { success: false, message: err.message || 'Internal error' }, corsHeaders)
  }
})

// ── Stripe test ───────────────────────────────────────────────────────────────
async function testStripe(creds: Record<string, string>) {
  const { secretKey } = creds
  if (!secretKey) {
    return json(400, { success: false, message: 'Secret Key is required' }, corsHeaders)
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })
    const account = await stripe.account.retrieve()
    return json(200, { success: true, message: `Connected to Stripe account: ${account.id}` }, corsHeaders)
  } catch (err: any) {
    return json(400, { success: false, message: `Stripe error: ${err.message}` }, corsHeaders)
  }
}

// ── Slack test ────────────────────────────────────────────────────────────────
async function testSlack(creds: Record<string, string>) {
  const { webhookUrl } = creds
  if (!webhookUrl) {
    return json(400, { success: false, message: 'Webhook URL is required' }, corsHeaders)
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '✅ Integration test successful — your Slack webhook is working!',
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return json(400, { success: false, message: `Slack rejected webhook: ${resp.status} ${text.slice(0, 100)}` }, corsHeaders)
    }

    return json(200, { success: true, message: 'Test message sent to Slack' }, corsHeaders)
  } catch (err: any) {
    return json(500, { success: false, message: `Network error: ${err.message}` }, corsHeaders)
  }
}

// ── ShopMonkey test ──────────────────────────────────────────────────────────
async function testShopMonkey(creds: Record<string, string>) {
  const { apiKey } = creds
  if (!apiKey) {
    return json(400, { success: false, message: 'API Key is required' }, corsHeaders)
  }

  // ShopMonkey blocks cloud ASN (1010). This call will likely fail from Supabase.
  // We still attempt it and surface the error so the user knows to run local verification.
  const baseUrl = 'https://api.shopmonkey.cloud/v3'

  try {
    // Call a lightweight endpoint — location list is small
    const resp = await fetch(`${baseUrl}/location?skip=0&limit=1`, {
      headers: {
        'x-api-key': apiKey,
      },
    })

    if (!resp.ok) {
      return json(400, { success: false, message: `ShopMonkey API returned ${resp.status}. (Note: ShopMonkey may block cloud IPs — run verification locally.)` }, corsHeaders)
    }

    const data = await resp.json()
    const locName = data?.data?.[0]?.name || 'unknown'
    return json(200, { success: true, message: `Connected — first location: ${locName}` }, corsHeaders)
  } catch (err: any) {
    return json(500, { success: false, message: `Network error (likely ASN block). ${err.message}` }, corsHeaders)
  }
}

// ── Carfax test ──────────────────────────────────────────────────────────────
async function testCarfax(creds: Record<string, string>) {
  const { apiKey } = creds
  if (!apiKey) {
    return json(400, { success: false, message: 'API Key is required' }, corsHeaders)
  }

  // Carfax API endpoint — use VIN lookup (requires valid VIN). Use sample VIN for testing.
  const testVin = '1FAHP2F83EG104123' // 2014 Ford F-150 (common test VIN)

  try {
    const resp = await fetch(`https://api.carfax.com/v2/vehicle/${testVin}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    // 404 is acceptable — it means the VIN doesn't exist but the key is valid
    if (resp.status === 404) {
      return json(200, { success: true, message: 'API key accepted (test VIN not found but credentials valid)' }, corsHeaders)
    }

    if (!resp.ok) {
      return json(400, { success: false, message: `CARFAX API returned ${resp.status}` }, corsHeaders)
    }

    const data = await resp.json()
    return json(200, { success: true, message: `Connected — vehicle: ${data?.vehicle?.year || 'found'}` }, corsHeaders)
  } catch (err: any) {
    return json(500, { success: false, message: `Network error: ${err.message}` }, corsHeaders)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
