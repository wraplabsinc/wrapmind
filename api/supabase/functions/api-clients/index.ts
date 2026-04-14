// Supabase Edge Function: api-clients
// Preserves /api/clients URL structure for external callers.
//
// Routes:
//   GET    /api/clients          → list clients
//   POST   /api/clients          → create client
//   GET    /api/clients/:id      → get single client
//   PATCH  /api/clients/:id      → update client
//
// Auth: Requires Authorization: Bearer <jwt> header

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Verify auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get user's org_id
  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['api', 'clients', ...id]

  try {
    // GET /api/clients or POST /api/clients
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'clients') {
      if (req.method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const search = url.searchParams.get('search')
        const offset = (page - 1) * limit

        let query = supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('org_id', profile.org_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (search) {
          query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
          )
        }

        const { data, error, count } = await query
        if (error) throw error

        return new Response(JSON.stringify({
          clients: data,
          pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (req.method === 'POST') {
        const body = await req.json()
        const clientData = { ...body, org_id: profile.org_id }

        const { data, error } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify({ client: data }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // /api/clients/:id
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'clients') {
      const id = pathParts[2]

      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .single()

        if (error || !data) throw new Error('Client not found')

        // Also get job history
        const { data: jobHistory } = await supabase
          .from('estimates')
          .select('id, estimate_id, status, vehicle_json, created_at, total')
          .eq('client_id', id)
          .eq('archived', false)
          .order('created_at', { ascending: false })

        return new Response(JSON.stringify({ client: data, jobHistory: jobHistory || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (req.method === 'PATCH') {
        const body = await req.json()
        const { data, error } = await supabase
          .from('clients')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .select()
          .single()

        if (error || !data) throw new Error('Client not found or update failed')

        return new Response(JSON.stringify({ client: data }), {
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
