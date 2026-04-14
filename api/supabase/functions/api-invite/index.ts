// Supabase Edge Function: api-invite
// Generates a 7-day magic invite link for new team members.
//
// Owner flow:
//   POST /api-invite  { email, first_name, last_name, role }
//   → creates auth user + 7-day magic link via GoTrue Admin API
//   → creates pending user in users table
//   → returns { magic_link, user }
//
// The owner copies the magic link and sends it to the new team member.
// When the new member opens it, they set their password.
// Their auth_user_id is auto-linked via the on_auth_user_confirmed trigger.

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

  // ── Authenticate caller ────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'No token provided' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify the caller's JWT
  const supabaseAsUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user: caller }, error: authError } = await supabaseAsUser.auth.getUser(token)
  if (authError || !caller) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Verify caller is an owner ─────────────────────────────────────────────
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerProfile } = await supabaseAdmin
    .from('users')
    .select('id, role, org_id')
    .eq('auth_user_id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    return new Response(JSON.stringify({ error: 'Only owners can invite users' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let email: string, first_name: string, last_name: string, role: string
  try {
    const body = await req.json()
    email = (body.email || '').toLowerCase().trim()
    first_name = (body.first_name || '').trim()
    last_name = (body.last_name || '').trim()
    role = body.role || 'writer'
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!email || !first_name || !last_name) {
    return new Response(JSON.stringify({ error: 'email, first_name, and last_name are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!['owner', 'manager', 'writer'].includes(role)) {
    return new Response(JSON.stringify({ error: 'role must be owner, manager, or writer' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Check if email already exists in auth.users ───────────────────────────
  const { data: existingAuth } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingAuth) {
    return new Response(JSON.stringify({ error: 'A user with this email already exists in Supabase Auth' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Generate 7-day invite link via GoTrue Admin API ───────────────────────
  // POST /auth/v1/admin/generate_link creates a user AND returns a signed link
  const siteUrl = Deno.env.get('SITE_URL') ||
    (supabaseUrl.includes('.supabase.co') ? `https://${supabaseUrl.split('.')[0]}.supabase.co` : supabaseUrl)

  let generatedLink: string
  let authUserId: string

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'invite',
        email,
        user_metadata: { first_name, last_name },
        password: crypto.randomUUID(), // placeholder — user sets their own
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data.msg || data.error || JSON.stringify(data)
      throw new Error(`GoTrue error ${response.status}: ${msg}`)
    }

    generatedLink = data.action_link || data.confirm_url
    authUserId = data.user?.id

    // Fallback: construct URL from hashed_token + redirect_to
    if (!generatedLink && data.hashed_token) {
      const redirectTo = encodeURIComponent(`${siteUrl}`)
      generatedLink = `${siteUrl}/auth/v1/verify?hashed_token=${data.hashed_token}&type=invite&redirect_to=${redirectTo}`
    }

    if (!generatedLink) {
      throw new Error('GoTrue did not return a link. Check Supabase logs.')
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: `Failed to generate invite link: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Create pending user in users table ─────────────────────────────────────
  const { data: pendingUser, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      first_name,
      last_name,
      role,
      org_id: callerProfile.org_id,
      status: 'pending',
    })
    .select('id, email, first_name, last_name, role, org_id, status')
    .single()

  if (insertError) {
    // Rollback: delete the auth user we just created
    if (authUserId) {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
      })
    }
    return new Response(JSON.stringify({ error: `Failed to create user record: ${insertError.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    magic_link: generatedLink,
    user: pendingUser,
    message: 'Share this magic link with your team member. It expires in 7 days.',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
