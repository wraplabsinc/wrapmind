import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const { email, password } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    return new Response(JSON.stringify({
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
      error_message: error?.message,
      error_code: error?.code,
      status: error ? 400 : 200,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: error ? 400 : 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
