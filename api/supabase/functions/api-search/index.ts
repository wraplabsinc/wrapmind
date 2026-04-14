// Supabase Edge Function: api-search
// Preserves /api/search URL structure for external callers.
//
// Routes:
//   GET /api/search?q=...&type=estimates|clients|vehicles|leads|all
//
// Auth: Requires Authorization: Bearer *** header

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getUserProfile(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, org_id')
    .eq('auth_user_id', userId)
    .single()
  return data
}

async function verifyAuth(supabaseUrl: string, authHeader: string | null) {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const user = await verifyAuth(supabaseUrl, req.headers.get('authorization'))
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['api', 'search']

  if (pathParts.length < 2 || pathParts[0] !== 'api' || pathParts[1] !== 'search') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const q = (url.searchParams.get('q') || '').trim()
  const type = url.searchParams.get('type') || 'all'
  const limit = parseInt(url.searchParams.get('limit') || '10')

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ error: 'Search query must be at least 2 characters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const results: Record<string, any[]> = { estimates: [], clients: [], vehicles: [], leads: [] }

    // Estimates
    if (type === 'all' || type === 'estimates') {
      const { data: estimates } = await supabase
        .from('estimates')
        .select('id, estimate_id, status, vehicle_json, client_id, created_at')
        .eq('org_id', profile.org_id)
        .eq('archived', false)
        .ilike('estimate_id', `%${q}%`)
        .limit(limit)

      results.estimates = estimates || []
    }

    // Clients
    if (type === 'all' || type === 'clients') {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .eq('org_id', profile.org_id)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(limit)

      results.clients = clients || []
    }

    // Vehicles — search inside vehicle_json on estimates
    if (type === 'all' || type === 'vehicles') {
      const { data: vehicleEstimates } = await supabase
        .from('estimates')
        .select('id, estimate_id, vehicle_json, client_id')
        .eq('org_id', profile.org_id)
        .eq('archived', false)
        .ilike('vehicle_json::text', `%${q}%`)
        .limit(limit)

      results.vehicles = (vehicleEstimates || []).map((e: any) => ({
        estimate_id: e.estimate_id,
        vehicle: e.vehicle_json,
        client_id: e.client_id,
      }))
    }

    // Leads — search both intake_leads and leads tables
    if (type === 'all' || type === 'leads') {
      const { data: intakeLeads } = await supabase
        .from('intake_leads')
        .select('id, first_name, last_name, email, phone, status, vehicle_info')
        .eq('org_id', profile.org_id)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(limit)

      results.leads = intakeLeads || []
    }

    return new Response(JSON.stringify({ results, query: q }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
