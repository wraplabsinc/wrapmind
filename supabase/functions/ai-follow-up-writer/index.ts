// AI-powered follow-up message writer
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FollowUpRequest {
  customerId: string
  templateType: 'estimate_followup' | 'appointment_reminder' | 'service_completion' | 'custom'
  context?: {
    estimateId?: string
    appointmentId?: string
    vehicleInfo?: string
    customerName?: string
  }
  customMessage?: string
  tone?: 'professional' | 'friendly' | 'urgent'
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

    const body: FollowUpRequest = await req.json()

    if (!body.customerId || !body.templateType) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: customerId and templateType are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single()

    if (customerError) {
      throw new Error(`Customer not found: ${customerError.message}`)
    }

    // Build context for message generation
    const customerName = body.context?.customerName || customer.name || 'Valued Customer'
    const vehicleInfo = body.context?.vehicleInfo || ''
    const tone = body.tone || 'professional'

    // Generate appropriate message based on template type
    let subject = ''
    let message = ''

    switch (body.templateType) {
      case 'estimate_followup':
        subject = `Follow-up on Your Vehicle Service Estimate`
        message = `Dear ${customerName},\n\nThank you for considering our automotive services for your ${vehicleInfo || 'vehicle'}.\n\nWe wanted to follow up on the estimate we provided. If you have any questions or would like to proceed with the service, please don't hesitate to reach out.\n\nWe're here to help and look forward to serving you.\n\nBest regards,\nYour Service Team`
        break

      case 'appointment_reminder':
        subject = `Appointment Reminder`
        message = `Hi ${customerName},\n\nThis is a friendly reminder about your upcoming appointment for your ${vehicleInfo || 'vehicle'}.\n\nPlease let us know if you need to reschedule or if you have any questions before your visit.\n\nWe look forward to seeing you!\n\nBest regards,\nYour Service Team`
        break

      case 'service_completion':
        subject = `Your Vehicle Service is Complete`
        message = `Hi ${customerName},\n\nGreat news! Your ${vehicleInfo || 'vehicle'} is ready for pickup. All requested services have been completed.\n\nPlease pick up your vehicle at your earliest convenience. If you have any questions about the service performed, we're happy to help.\n\nThank you for your business!\n\nBest regards,\nYour Service Team`
        break

      case 'custom':
        subject = `Message from Your Service Team`
        message = body.customMessage || `Hi ${customerName},\n\n${body.customMessage || 'Thank you for choosing us for your automotive needs.'}\n\nBest regards,\nYour Service Team`
        break

      default:
        subject = `Update from Your Service Team`
        message = `Dear ${customerName},\n\nThank you for your business. Please reach out if you have any questions.\n\nBest regards,\nYour Service Team`
    }

    // Store the follow-up record
    const { data: followUp, error: followUpError } = await supabase
      .from('follow_ups')
      .insert({
        customer_id: body.customerId,
        template_type: body.templateType,
        subject,
        message,
        tone,
        context: body.context || null,
        status: 'generated',
      })
      .select()
      .single()

    if (followUpError) {
      console.error('Failed to store follow-up record:', followUpError)
      // Don't throw, just log - we still want to return the generated message
    }

    return new Response(JSON.stringify({
      success: true,
      followUp: {
        id: followUp?.id,
        customerId: body.customerId,
        templateType: body.templateType,
        subject,
        message,
        tone,
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
