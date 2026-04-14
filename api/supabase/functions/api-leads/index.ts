// Supabase Edge Function: api-leads
// Preserves /api/intake/* URL structure for external callers (n8n, webhooks, etc.)
//
// Public routes (no auth):
//   POST /api/intake  → submit a new lead (public intake form)
//
// Authenticated routes:
//   GET  /api/intake/leads              → list leads
//   GET  /api/intake/leads/:id          → get single lead
//   POST /api/intake/leads/:id/convert  → convert lead to client
//   PATCH /api/intake/leads/:id/status  → update lead status
//
// Auth: Requires Authorization: Bearer *** header (except POST /intake)

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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['api', 'intake', ...rest]

  // ── Public: POST /api/intake (submit lead) ──────────────────────────────────
  if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'intake' && req.method === 'POST') {
    const body = await req.json()
    const { data, error } = await supabase
      .from('intake_leads')
      .insert({ ...body, status: 'new' })
      .select()
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ lead: data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Authenticated routes ────────────────────────────────────────────────────
  const user = await verifyAuth(supabaseUrl, req.headers.get('authorization'))
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── GET /api/intake/leads ────────────────────────────────────────────────
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'intake' && pathParts[2] === 'leads' && req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const status = url.searchParams.get('status')
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'
      const offset = (page - 1) * limit

      let query = supabase
        .from('intake_leads')
        .select('*', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1)

      if (status) query = query.eq('status', status)

      const { data, error, count } = await query
      if (error) throw error

      return new Response(JSON.stringify({
        leads: data,
        pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── /api/intake/leads/:id/* ───────────────────────────────────────────────
    if (pathParts.length === 4 && pathParts[0] === 'api' && pathParts[1] === 'intake' && pathParts[2] === 'leads') {
      const id = pathParts[3]
      const subPath = pathParts.slice(4)

      // GET /api/intake/leads/:id
      if (subPath.length === 0 && req.method === 'GET') {
        const { data, error } = await supabase
          .from('intake_leads')
          .select('*')
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .single()

        if (error || !data) throw new Error('Lead not found')
        return new Response(JSON.stringify({ lead: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // POST /api/intake/leads/:id/convert
      if (subPath.length === 1 && subPath[0] === 'convert' && req.method === 'POST') {
        const { data: lead, error: leadError } = await supabase
          .from('intake_leads')
          .select('*')
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .single()

        if (leadError || !lead) throw new Error('Lead not found')

        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            org_id: profile.org_id,
          })
          .select()
          .single()

        if (clientError) throw clientError

        await supabase
          .from('intake_leads')
          .update({ status: 'converted', converted_to_client_id: client.id })
          .eq('id', id)

        return new Response(JSON.stringify({ message: 'Lead converted', client, lead }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // PATCH /api/intake/leads/:id/status
      if (subPath.length === 1 && subPath[0] === 'status' && req.method === 'PATCH') {
        const { status } = await req.json()
        if (!status) throw new Error('Status is required')

        const { data, error } = await supabase
          .from('intake_leads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .select()
          .single()

        if (error || !data) throw new Error('Lead not found')
        return new Response(JSON.stringify({ lead: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
