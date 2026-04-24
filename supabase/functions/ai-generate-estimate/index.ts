// AI-powered estimate generation
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EstimateRequest {
  customerId: string
  vehicleId: string
  services: Array<{
    description: string
    cost: number
    laborHours: number
  }>
  notes?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: EstimateRequest = await req.json()

    // Validate required fields
    if (!body.customerId || !body.vehicleId || !body.services?.length) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: customerId, vehicleId, and services are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate totals
    const totalCost = body.services.reduce((sum, s) => sum + s.cost, 0)
    const totalLaborHours = body.services.reduce((sum, s) => sum + (s.laborHours || 0), 0)

    // Create estimate record
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        customer_id: body.customerId,
        vehicle_id: body.vehicleId,
        total_amount: totalCost,
        status: 'draft',
        notes: body.notes || null,
      })
      .select()
      .single()

    if (estimateError) {
      throw new Error(`Failed to create estimate: ${estimateError.message}`)
    }

    // Create line items
    const lineItems = body.services.map(service => ({
      estimate_id: estimate.id,
      description: service.description,
      quantity: 1,
      unit_price: service.cost,
      labor_hours: service.laborHours || 0,
    }))

    const { error: lineItemsError } = await supabase
      .from('estimate_line_items')
      .insert(lineItems)

    if (lineItemsError) {
      throw new Error(`Failed to create line items: ${lineItemsError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      estimate: {
        id: estimate.id,
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        totalAmount: totalCost,
        laborHours: totalLaborHours,
        status: 'draft',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
