// AI-powered personality analysis for customers
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PersonalityAnalysisRequest {
  customerId: string
  interactionData?: {
    totalInteractions: number
    preferredContactMethod?: 'email' | 'phone' | 'sms'
    communicationStyle?: 'formal' | 'casual' | 'brief'
    responseRate?: number
  }
}

interface PersonalityProfile {
  communicationStyle: 'formal' | 'casual' | 'friendly' | 'reserved'
  preferredContact: 'email' | 'phone' | 'sms' | 'any'
  buyingTendency: 'decisive' | 'deliberate' | 'cautious' | 'exploratory'
  servicePreference: 'express' | 'thorough' | 'consultative' | 'independent'
  engagementLevel: 'high' | 'medium' | 'low'
  recommendations: string[]
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

    const body: PersonalityAnalysisRequest = await req.json()

    if (!body.customerId) {
      return new Response(JSON.stringify({
        error: 'Missing required field: customerId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch customer data and interaction history
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single()

    if (customerError) {
      throw new Error(`Customer not found: ${customerError.message}`)
    }

    // Fetch interaction history
    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', body.customerId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Analyze and generate personality profile
    const profile: PersonalityProfile = analyzePersonality(customer, interactions, body.interactionData)

    // Store the analysis result
    const { data: analysis, error: analysisError } = await supabase
      .from('personality_analyses')
      .insert({
        customer_id: body.customerId,
        profile,
        interaction_count: interactions?.length || 0,
        source: 'ai_analysis',
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Failed to store analysis:', analysisError)
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        id: analysis?.id,
        customerId: body.customerId,
        profile,
        interactionCount: interactions?.length || 0,
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

function analyzePersonality(
  customer: any,
  interactions: any[] | null,
  interactionData?: PersonalityAnalysisRequest['interactionData']
): PersonalityProfile {
  // Base analysis on available data
  const contactMethod = interactionData?.preferredContactMethod || 
    (customer.preferred_contact === 'email' ? 'email' : 
     customer.preferred_contact === 'phone' ? 'phone' : 
     customer.preferred_contact === 'sms' ? 'sms' : 'any')

  const commStyle = interactionData?.communicationStyle || 
    (customer.communication_style as PersonalityProfile['communicationStyle']) || 'friendly'

  const responseRate = interactionData?.responseRate ?? 0.7
  const totalInteractions = interactionData?.totalInteractions ?? interactions?.length ?? 0

  // Determine engagement level
  let engagementLevel: PersonalityProfile['engagementLevel'] = 'medium'
  if (totalInteractions >= 10) engagementLevel = 'high'
  else if (totalInteractions <= 2) engagementLevel = 'low'

  // Determine communication style
  let communicationStyle: PersonalityProfile['communicationStyle'] = 'friendly'
  if (commStyle === 'formal') communicationStyle = 'formal'
  else if (commStyle === 'casual') communicationStyle = 'casual'
  else if (responseRate < 0.5) communicationStyle = 'reserved'

  // Determine buying tendency
  let buyingTendency: PersonalityProfile['buyingTendency'] = 'exploratory'
  if (responseRate > 0.8 && totalInteractions > 5) buyingTendency = 'decisive'
  else if (responseRate < 0.5) buyingTendency = 'cautious'
  else if (totalInteractions > 3) buyingTendency = 'deliberate'

  // Determine service preference
  let servicePreference: PersonalityProfile['servicePreference'] = 'consultative'
  if (customer.notes?.includes('express')) servicePreference = 'express'
  else if (customer.notes?.includes('thorough')) servicePreference = 'thorough'
  else if (customer.notes?.includes('independent')) servicePreference = 'independent'

  // Generate recommendations
  const recommendations: string[] = []
  if (communicationStyle === 'formal') {
    recommendations.push('Use professional language in all communications')
  } else if (communicationStyle === 'casual' || communicationStyle === 'friendly') {
    recommendations.push('Keep communications warm and personable')
  }

  if (buyingTendency === 'decisive') {
    recommendations.push('Provide clear options - they appreciate quick decisions')
  } else if (buyingTendency === 'cautious') {
    recommendations.push('Provide detailed information and reassurance')
  }

  if (contactMethod !== 'any') {
    recommendations.push(`Preferred contact method: ${contactMethod}`)
  }

  if (engagementLevel === 'high') {
    recommendations.push('Maintain regular touchpoints - they are highly engaged')
  } else if (engagementLevel === 'low') {
    recommendations.push('Consider periodic check-ins to increase engagement')
  }

  return {
    communicationStyle,
    preferredContact: contactMethod as PersonalityProfile['preferredContact'],
    buyingTendency,
    servicePreference,
    engagementLevel,
    recommendations,
  }
}
