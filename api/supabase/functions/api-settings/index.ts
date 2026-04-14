// Supabase Edge Function: api-settings
// Preserves /api/settings URL structure for external callers.
//
// Routes:
//   GET    /api/settings         → get shop settings
//   PATCH  /api/settings         → upsert shop settings
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

  // Verify auth
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
  // pathParts: ['api', 'settings']

  try {
    // GET /api/settings
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'settings' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('org_id', profile.org_id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return new Response(JSON.stringify({ settings: data || {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PATCH /api/settings — upsert
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'settings' && (req.method === 'PATCH' || req.method === 'PUT')) {
      const body = await req.json()

      const { data: existing } = await supabase
        .from('shop_settings')
        .select('id')
        .eq('org_id', profile.org_id)
        .single()

      let result
      if (existing) {
        const { data, error } = await supabase
          .from('shop_settings')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('org_id', profile.org_id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('shop_settings')
          .insert({ ...body, org_id: profile.org_id })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      return new Response(JSON.stringify({ settings: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
