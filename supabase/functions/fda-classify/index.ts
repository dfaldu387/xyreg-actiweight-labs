import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { deviceDescription, intendedUse, bodyContact, technology } = await req.json();
    
    console.log('FDA Classification Request:', { deviceDescription, intendedUse, bodyContact, technology });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an FDA medical device classification expert. Your role is to analyze device descriptions and determine:
1. The most likely FDA Product Code (from the 1,700+ codes across 16 medical specialty panels)
2. The device classification (Class I, II, or III)
3. The regulatory pathway (510(k) exempt, 510(k) clearance, or PMA)
4. Rationale for the classification
5. Suggested predicate devices (for 510(k) pathway)

Provide your response in JSON format with these fields:
{
  "productCode": "XXX",
  "productCodeName": "Full product code name",
  "deviceClass": "Class I/II/III",
  "regulatoryPathway": "510(k) Exempt / 510(k) Clearance / PMA",
  "panelName": "Name of medical specialty panel",
  "rationale": "Detailed explanation of classification reasoning",
  "riskFactors": ["List of key risk factors considered"],
  "predicateDevices": ["Suggested predicate device names for 510(k)"],
  "fdaGuidanceLinks": ["Relevant FDA guidance document URLs"],
  "confidence": "high/medium/low"
}`;

    const userPrompt = `Classify this medical device:

Device Description: ${deviceDescription}
Intended Use: ${intendedUse}
Body Contact: ${bodyContact}
Technology: ${technology}

Provide FDA classification analysis in JSON format.`;

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI Response:', content);

    // Parse JSON from response (handle markdown code blocks if present)
    let classificationResult;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      classificationResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Attempt to extract structured data from free text
      classificationResult = {
        productCode: "Unknown",
        productCodeName: "Unable to determine",
        deviceClass: content.includes('Class III') ? 'Class III' : content.includes('Class II') ? 'Class II' : 'Class I',
        regulatoryPathway: content.includes('PMA') ? 'PMA' : content.includes('510(k)') ? '510(k) Clearance' : '510(k) Exempt',
        panelName: "General",
        rationale: content,
        riskFactors: [],
        predicateDevices: [],
        fdaGuidanceLinks: [],
        confidence: "low"
      };
    }

    return new Response(
      JSON.stringify(classificationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fda-classify function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});