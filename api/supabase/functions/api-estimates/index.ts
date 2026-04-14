// Supabase Edge Function: api-estimates
// Preserves /api/estimates URL structure for external callers (n8n, webhooks, etc.)
// The React app talks to Supabase directly and doesn't need this.
//
// Routes:
//   GET    /api/estimates              → list estimates
//   POST   /api/estimates              → create estimate
//   GET    /api/estimates/:id          → get single estimate
//   PATCH  /api/estimates/:id         → update estimate
//   DELETE /api/estimates/:id          → archive estimate
//   GET    /api/estimates/:id/notes   → get estimate notes
//   POST   /api/estimates/:id/notes   → add note
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
  // pathParts: ['api', 'estimates', ...rest]

  try {
    // ── GET /api/estimates ────────────────────────────────────────────────────
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'estimates' && req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const status = url.searchParams.get('status')
      const client_id = url.searchParams.get('client_id')
      const writer_id = url.searchParams.get('writer_id')
      const date_from = url.searchParams.get('date_from')
      const date_to = url.searchParams.get('date_to')
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'
      const offset = (page - 1) * limit

      let query = supabase
        .from('estimates')
        .select('*', { count: 'exact' })
        .eq('archived', false)
        .eq('org_id', profile.org_id)
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1)

      if (status) query = query.eq('status', status)
      if (client_id) query = query.eq('client_id', client_id)
      if (writer_id) query = query.eq('writer_id', writer_id)
      if (date_from) query = query.gte('created_at', date_from)
      if (date_to) query = query.lte('created_at', date_to)

      const { data, error, count } = await query
      if (error) throw error

      return new Response(JSON.stringify({
        estimates: data,
        pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── POST /api/estimates ───────────────────────────────────────────────────
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'estimates' && req.method === 'POST') {
      const body = await req.json()

      const estimateData = {
        ...body,
        org_id: profile.org_id,
        writer_id: profile.id,
      }

      const { data, error } = await supabase
        .from('estimates')
        .insert(estimateData)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ estimate: data }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── /api/estimates/:id/* ─────────────────────────────────────────────────
    if (pathParts.length >= 3 && pathParts[0] === 'api' && pathParts[1] === 'estimates') {
      const id = pathParts[2]
      const subPath = pathParts.slice(3)

      // GET /api/estimates/:id
      if (subPath.length === 0 && req.method === 'GET') {
        const { data, error } = await supabase
          .from('estimates')
          .select('*')
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .single()

        if (error || !data) throw new Error('Estimate not found')
        return new Response(JSON.stringify({ estimate: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // PATCH /api/estimates/:id
      if (subPath.length === 0 && (req.method === 'PATCH' || req.method === 'PUT')) {
        const body = await req.json()
        const { data, error } = await supabase
          .from('estimates')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .select()
          .single()

        if (error || !data) throw new Error('Estimate not found or update failed')
        return new Response(JSON.stringify({ estimate: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // DELETE /api/estimates/:id → archive
      if (subPath.length === 0 && req.method === 'DELETE') {
        const { error } = await supabase
          .from('estimates')
          .update({ archived: true, archived_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', profile.org_id)

        if (error) throw error
        return new Response(JSON.stringify({ message: 'Estimate archived' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // POST /api/estimates/:id/approve
      if (subPath.length === 1 && subPath[0] === 'approve' && req.method === 'POST') {
        const { data, error } = await supabase
          .from('estimates')
          .update({ status: 'approved', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .select()
          .single()

        if (error || !data) throw new Error('Estimate not found')
        return new Response(JSON.stringify({ estimate: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // GET /api/estimates/:id/notes
      if (subPath.length === 1 && subPath[0] === 'notes' && req.method === 'GET') {
        const { data, error } = await supabase
          .from('estimate_notes')
          .select('*')
          .eq('estimate_id', id)

        if (error) throw error
        return new Response(JSON.stringify({ notes: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // POST /api/estimates/:id/notes
      if (subPath.length === 1 && subPath[0] === 'notes' && req.method === 'POST') {
        const body = await req.json()
        const { data, error } = await supabase
          .from('estimate_notes')
          .insert({ ...body, estimate_id: id })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ note: data }), {
          status: 201,
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
