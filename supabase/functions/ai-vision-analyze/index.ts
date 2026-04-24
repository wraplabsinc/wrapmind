// AI vision analysis for vehicle images using Anthropic Claude.
// Analyzes vehicle photos and returns structured vehicle information.
// Deployed to: nbewyeoiizlsfmbqoist
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System prompt for vehicle analysis
const VEHICLE_ANALYSIS_PROMPT = `You are a senior automotive technician performing a pre-job vehicle inspection.
Analyze the provided vehicle photos and return ONLY valid JSON with no additional text, markdown, or explanation.
The JSON must match this exact schema:
{
  "vehicleLabel": "YYYY Make Model (e.g., 2024 Tesla Model 3)",
  "year": "XXXX (4-digit year)",
  "make": "manufacturer name",
  "model": "model name",
  "bodyStyle": "sedan|suv|truck|coupe|hatchback|wagon|van|convertible|crossover|other",
  "color": "primary color observed",
  "hasDamage": true|false,
  "damageNotes": "description of any visible damage, or null if none",
  "conditionNotes": "overall vehicle condition observations",
  "confidence": 0.0-1.0 (your confidence in this analysis)
}

If you cannot determine a field, use null. Be specific about damage or condition issues.`

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { photos } = await req.json()

    // Validate photos array
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: 'Photos array is required with at least one image' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Validate each photo has required fields
    for (const photo of photos) {
      if (!photo.data || !photo.media_type) {
        return new Response(JSON.stringify({ error: 'Each photo must have data (base64) and media_type fields' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Build the image content blocks
    const imageContent = photos.map((photo: { data: string; media_type?: string }) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: photo.media_type || 'image/jpeg',
        data: photo.data,
      },
    }))

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-7-20250514',
        max_tokens: 1024,
        system: VEHICLE_ANALYSIS_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze these vehicle photos and return the inspection results as JSON.',
              },
              ...imageContent,
            ],
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error:', errorText)
      return new Response(JSON.stringify({ 
        error: 'AI vision analysis failed',
        details: `Anthropic API error: ${anthropicResponse.status}`
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content?.[0]?.text

    if (!responseText) {
      return new Response(JSON.stringify({ error: 'No response from AI vision analysis' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ 
        error: 'AI vision analysis did not return valid JSON',
        raw: responseText
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    let vehicle
    try {
      vehicle = JSON.parse(jsonMatch[0])
    } catch {
      return new Response(JSON.stringify({ 
        error: 'AI vision analysis returned malformed JSON',
        raw: jsonMatch[0]
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      vehicle,
      analysis: {
        photosAnalyzed: photos.length,
        model: anthropicData.model,
      },
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('AI vision analysis error:', error)
    return new Response(JSON.stringify({ 
      error: 'AI vision analysis failed',
      details: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
