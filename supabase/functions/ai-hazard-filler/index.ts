import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { checkAiCredits, logAiTokenUsage, trackTokenUsage, extractGeminiUsage } from "../_shared/token-tracking.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HazardFillRequest {
  companyId: string;
  requirementDescription: string;
  requirementId: string;
  requirementCategory?: string;
  existingHazardData?: {
    hazardous_situation?: string;
    potential_harm?: string;
    foreseeable_sequence_events?: string;
  };
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, requirementDescription, requirementId, requirementCategory, existingHazardData, productData }: HazardFillRequest = await req.json();

    if (!companyId || !requirementDescription) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: companyId and requirementDescription'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check AI credits before processing
    if (companyId) {
      const creditCheck = await checkAiCredits(companyId);
      if (!creditCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "NO_CREDITS",
            message: "No AI credits remaining. Purchase an AI Booster Pack to continue.",
            used: creditCheck.used,
            limit: creditCheck.limit,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from auth header
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAnon.auth.getUser(token);
      userId = user?.id;
    }

    // Fetch company's Gemini API key
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('*')
      .eq('company_id', companyId)
      .eq('key_type', 'gemini');

    if (apiKeyError || !apiKeys || apiKeys.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No Gemini API key configured for this company. Please add one in Settings > API Keys.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encryptedKey = apiKeys[0].encrypted_key;
    const ENCRYPTION_KEY = 'medtech-api-key-2024';

    let geminiApiKey: string;
    try {
      if (encryptedKey.startsWith('AIza')) {
        geminiApiKey = encryptedKey;
      } else {
        const base64Decoded = atob(encryptedKey);
        geminiApiKey = Array.from(base64Decoded)
          .map((char, index) =>
            String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
          )
          .join('');
      }
    } catch {
      geminiApiKey = encryptedKey;
    }

    const hasExistingData = existingHazardData && (existingHazardData.hazardous_situation || existingHazardData.potential_harm || existingHazardData.foreseeable_sequence_events);

    const prompt = hasExistingData
      ? `You are an expert medical device risk management consultant specializing in ISO 14971 hazard analysis.

TASK: Complete the ISO 14971 risk record for a hazard that has ALREADY been partially identified. The data below is FIXED — your suggestions MUST be consistent with it. Do NOT invent a new unrelated hazard.

=== FIXED HAZARD DATA (DO NOT CONTRADICT) ===
${existingHazardData.hazardous_situation ? `Root Cause / Hazardous Situation: "${existingHazardData.hazardous_situation}"` : ''}
${existingHazardData.potential_harm ? `Potential Harm: "${existingHazardData.potential_harm}"` : ''}
${existingHazardData.foreseeable_sequence_events ? `Source / Foreseeable Sequence: "${existingHazardData.foreseeable_sequence_events}"` : ''}
=== END FIXED DATA ===

Hazard Record Reference:
- ID: ${requirementId}
- Description: ${requirementDescription}
- Category: ${requirementCategory || 'Not specified'}

Product Context (for background only — the hazard above takes priority):
- Product Name: ${productData.product_name || 'Not specified'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Indications for Use: ${productData.indications_for_use || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Duration of Use: ${productData.duration_of_use || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

Return a JSON object with this exact structure:
{
  "description": "Clear identification of the hazard source (2-3 sentences)",
  "foreseeable_sequence_events": "Step-by-step chain of events from the hazard to the hazardous situation (3-5 steps described narratively)",
  "hazardous_situation": "Refined version of the provided Root Cause (2-3 sentences)",
  "potential_harm": "Consistent with the provided Potential Harm (1-2 sentences)",
  "category": "One of: materials_patient_contact, combination_other_products, human_factors, training_requirements, cleaning_maintenance, negative_air_pressure, electrical_energy, sterility_requirements, critical_data_storage, software_use, disposal, manufacturing_residues, transport_storage, shelf_life, product_realization, customer_requirements, purchasing, service_provision, monitoring_devices",
  "initial_severity": 1-5,
  "initial_probability": 1-5,
  "risk_control_measure": "Detailed description of the recommended risk control measure (2-3 sentences)",
  "risk_control_type": "One of: design, protective_measure, information_for_safety",
  "residual_severity": 1-5,
  "residual_probability": 1-5,
  "verification_implementation": "How to verify the risk control measure was correctly implemented (1-2 sentences)",
  "verification_effectiveness": "Evidence that the risk control measure is effective (1-2 sentences)",
  "rationale": "Brief explanation of why this hazard was identified (1-2 sentences)",
  "confidence": 0.7-1.0
}

IMPORTANT:
- The residual risk should be LOWER than the initial risk after applying controls
- Be specific to this device and the hazard described above, not generic
- The risk_control_type should follow ISO 14971 priority: design controls first, then protective measures, then information for safety
- Only return the JSON object, no other text`
      : `You are an expert medical device risk management consultant specializing in ISO 14971 hazard analysis.

Given a specific design requirement or hazard for a medical device, perform a complete hazard analysis by filling in ALL fields of an ISO 14971-compliant hazard record.

REQUIREMENT / HAZARD BEING ANALYZED:
- ID: ${requirementId}
- Description: ${requirementDescription}
- Category: ${requirementCategory || 'Not specified'}

PRODUCT CONTEXT:
- Product Name: ${productData.product_name || 'Not specified'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Indications for Use: ${productData.indications_for_use || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Duration of Use: ${productData.duration_of_use || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

Return a JSON object with this exact structure:
{
  "description": "Clear identification of the hazard source (2-3 sentences)",
  "foreseeable_sequence_events": "Step-by-step chain of events (3-5 steps described narratively)",
  "hazardous_situation": "The specific circumstance where people are exposed to the hazard (2-3 sentences)",
  "potential_harm": "The specific injury or adverse outcome (1-2 sentences)",
  "category": "One of: materials_patient_contact, combination_other_products, human_factors, training_requirements, cleaning_maintenance, negative_air_pressure, electrical_energy, sterility_requirements, critical_data_storage, software_use, disposal, manufacturing_residues, transport_storage, shelf_life, product_realization, customer_requirements, purchasing, service_provision, monitoring_devices",
  "initial_severity": 1-5,
  "initial_probability": 1-5,
  "risk_control_measure": "Detailed description of the recommended risk control measure (2-3 sentences)",
  "risk_control_type": "One of: design, protective_measure, information_for_safety",
  "residual_severity": 1-5,
  "residual_probability": 1-5,
  "verification_implementation": "How to verify the risk control measure (1-2 sentences)",
  "verification_effectiveness": "Evidence that the risk control measure is effective (1-2 sentences)",
  "rationale": "Brief explanation of why this hazard was identified (1-2 sentences)",
  "confidence": 0.7-1.0
}

IMPORTANT:
- The residual risk should be LOWER than the initial risk after applying controls
- Be specific to this device and requirement, not generic
- The risk_control_type should follow ISO 14971 priority
- Only return the JSON object, no other text`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-hazard-filler] Gemini API error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Gemini API error: ${response.status}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Track token usage
    const geminiUsage = extractGeminiUsage(data);
    if (geminiUsage && companyId) {
      try {
        await Promise.all([
          logAiTokenUsage({
            companyId,
            userId,
            source: 'ai_hazard_analysis',
            model: 'gemini-2.5-flash',
            usage: {
              inputTokens: geminiUsage.promptTokens,
              outputTokens: geminiUsage.completionTokens,
              thinkingTokens: 0,
              totalTokens: geminiUsage.totalTokens,
            },
          }),
          trackTokenUsage(companyId, 'gemini', geminiUsage),
        ]);
      } catch (trackErr) {
        console.error('[ai-hazard-filler] Token tracking error:', trackErr);
      }
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No content generated by AI'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    let suggestion;
    try {
      const cleanResponse = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      suggestion = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('[ai-hazard-filler] Parse error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to parse AI response'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      suggestion,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-hazard-filler] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
