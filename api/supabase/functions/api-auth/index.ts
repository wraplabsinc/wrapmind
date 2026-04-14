// Supabase Edge Function: api-auth
// Preserves /api/auth/* URL structure for external callers.
//
// Routes:
//   POST /api/auth/login     → signInWithPassword
//   POST /api/auth/logout    → signOut
//   GET  /api/auth/me        → get current user profile
//
// NOTE: The React app uses Supabase client directly and does NOT need this.
//       This is only for external callers (n8n, webhooks, etc.) that expect
//       the old Express API URL structure.

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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['api', 'auth', 'login'|'logout'|'me']

  if (pathParts.length < 2 || pathParts[0] !== 'auth') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const action = pathParts[1]

  try {
    const body = req.body ? await req.json() : {}

    // POST /api/auth/login
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = body

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, org_id')
        .eq('auth_user_id', data.user.id)
        .single()

      return new Response(JSON.stringify({
        token: data.session.access_token,
        user: profile || {
          id: data.user.id,
          email: data.user.email,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/auth/logout
    if (action === 'logout' && req.method === 'POST') {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      if (!token) {
        return new Response(JSON.stringify({ error: 'No token provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      await supabase.auth.setSession({ access_token: token, refresh_token: '' })
      const { error } = await supabase.auth.signOut()

      return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /api/auth/me
    if (action === 'me' && req.method === 'GET') {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      if (!token) {
        return new Response(JSON.stringify({ error: 'No token provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, org_id')
        .eq('auth_user_id', user.id)
        .single()

      return new Response(JSON.stringify({ user: profile || { id: user.id, email: user.email } }), {
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
