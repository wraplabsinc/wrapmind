// Stripe webhook handler
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({
      error: 'Missing stripe-signature header'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({
      error: `Webhook Error: ${err.message}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        // Update payment status in database
        await supabase
          .from('payments')
          .update({ 
            status: 'succeeded',
            stripe_payment_intent_id: paymentIntent.id,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)

        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            failure_message: paymentIntent.last_payment_error?.message || 'Payment failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription event:', event.type, subscription.id)

        await supabase
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'stripe_subscription_id'
          })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', subscription.id)

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice paid:', invoice.id)

        // Update subscription status
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)

        await supabase
          .from('invoices')
          .update({ status: 'failed' })
          .eq('stripe_invoice_id', invoice.id)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({
      received: true,
      eventType: event.type,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({
      error: `Webhook processing error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
