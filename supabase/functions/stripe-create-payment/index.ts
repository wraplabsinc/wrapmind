// Create Stripe payment intent
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

interface CreatePaymentRequest {
  amount: number // Amount in cents
  currency?: string
  customerId?: string
  estimateId?: string
  invoiceId?: string
  metadata?: Record<string, string>
  paymentMethodTypes?: string[]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: CreatePaymentRequest = await req.json()

    if (!body.amount || body.amount <= 0) {
      return new Response(JSON.stringify({
        error: 'Invalid amount: must be a positive number'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user is authenticated
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Missing authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired authentication token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build payment intent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: body.amount,
      currency: body.currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        ...body.metadata,
      },
    }

    // Link to customer if provided
    if (body.customerId) {
      // Verify customer belongs to user
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', body.customerId)
        .eq('user_id', user.id)
        .single()

      if (customerError) {
        return new Response(JSON.stringify({
          error: 'Customer not found or access denied'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (customer?.stripe_customer_id) {
        paymentIntentParams.customer = customer.stripe_customer_id
      }

      paymentIntentParams.metadata!.customer_id = body.customerId
    }

    if (body.estimateId) {
      paymentIntentParams.metadata!.estimate_id = body.estimateId
    }

    if (body.invoiceId) {
      paymentIntentParams.metadata!.invoice_id = body.invoiceId
    }

    if (body.paymentMethodTypes?.length) {
      paymentIntentParams.payment_method_types = body.paymentMethodTypes
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        customer_id: body.customerId || null,
        estimate_id: body.estimateId || null,
        invoice_id: body.invoiceId || null,
        stripe_payment_intent_id: paymentIntent.id,
        amount: body.amount,
        currency: body.currency || 'usd',
        status: 'pending',
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      // Don't throw - we still want to return the client secret
    }

    return new Response(JSON.stringify({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      paymentId: payment?.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error creating payment:', error)
    
    // Handle Stripe errors
    if (error.type?.startsWith('Stripe')) {
      return new Response(JSON.stringify({
        error: error.message,
        type: error.type,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
