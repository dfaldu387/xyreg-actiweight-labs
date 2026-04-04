import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a medical device regulatory expert specializing in UDI (Unique Device Identification) requirements. 
Your task is to generate essential design and manufacturing characteristics for a medical device based on provided context.

Essential characteristics should include relevant items from:
- Materials of construction (e.g., stainless steel, silicone, titanium)
- Physical dimensions and form factor
- Sterility status (sterile/non-sterile, sterilization method)
- Single-use or reusable
- Shelf life and storage conditions
- Critical components or features
- Packaging configuration
- Power source (if applicable)
- Software version (if applicable)

IMPORTANT RULES:
1. Generate a concise, bullet-point list of 5-8 key characteristics that would be meaningful for regulatory identification and device grouping.
2. Be specific and technical - synthesize characteristics from ALL provided information.
3. DO NOT simply echo back the input fields. Derive meaningful characteristics.
4. If a field says "Not specified" or is empty, do not mention it - skip to available data.
5. If very limited context is provided, acknowledge this and provide only characteristics that can be reasonably inferred.
6. Focus on regulatory-relevant characteristics that distinguish this device for UDI purposes.`;

    // Helper to format arrays/objects for the prompt
    const formatValue = (value: any, fallback: string = 'Not specified'): string => {
      if (!value) return fallback;
      if (typeof value === 'string') return value.trim() || fallback;
      if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : fallback;
      if (typeof value === 'object') return Object.keys(value).length > 0 ? JSON.stringify(value) : fallback;
      return String(value);
    };

    const userPrompt = `Generate essential design and manufacturing characteristics for this medical device:

=== DEVICE IDENTITY ===
Name: ${formatValue(context.name)}
Device Type: ${formatValue(context.device_type)}
Risk Class: ${formatValue(context.device_class)}

=== PURPOSE & CLINICAL USE ===
Intended Use: ${formatValue(context.intended_use)}
Patient Population: ${formatValue(context.patient_population)}
Intended Users: ${formatValue(context.intended_users)}
Duration of Use: ${formatValue(context.duration_of_use)}
Environment of Use: ${formatValue(context.environment_of_use)}
Contraindications: ${formatValue(context.contraindications)}
Clinical Benefits: ${formatValue(context.clinical_benefits)}

=== TECHNICAL CHARACTERISTICS ===
Description: ${formatValue(context.description)}
Key Features: ${formatValue(context.key_features)}
Components: ${formatValue(context.device_components)}
Technology Characteristics: ${formatValue(context.key_technology_characteristics)}
Regulatory Type: ${formatValue(context.primary_regulatory_type)}

Based on ALL the above information, synthesize and generate 5-8 essential design and manufacturing characteristics that are:
- Specific to THIS device (not generic)
- Relevant for regulatory UDI identification
- Derived from the provided context (do not fabricate details not inferable from the data)

If very limited information is provided, state: "⚠️ Limited device information available. The following characteristics are based on minimal context:" then provide what can be reasonably inferred.

Format as plain text with each characteristic on a new line starting with "• ".`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const characteristics = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({ characteristics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-udi-characteristics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
