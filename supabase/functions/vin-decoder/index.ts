// VIN to vehicle specs decoder. Ports vinController.ts.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  try {
    const body = await req.json()

    // TODO: port logic from api-archived/src/controllers/

    return new Response(JSON.stringify({ ok: true, body }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
