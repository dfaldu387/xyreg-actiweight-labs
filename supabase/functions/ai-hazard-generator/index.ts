import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HazardSuggestionRequest {
  companyId: string;
  categoryFilter?: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
  requirementSpecifications: Array<{
    id: string;
    requirement_id: string;
    description: string;
    category: string;
    linked_risks: string;
  }>;
  additionalPrompt?: string;
  outputLanguage?: string;
}

interface HazardSuggestion {
  description: string;
  hazardous_situation: string;
  potential_harm: string;
  foreseeable_sequence_events: string;
  rationale: string;
  confidence: number;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ai-hazard-generator] Starting hazard generation');
    
    const requestBody = await req.json();
    const { companyId, categoryFilter, productData, requirementSpecifications, additionalPrompt, outputLanguage } = requestBody as HazardSuggestionRequest;
    const existingItems = (requestBody as any).existingItems as string[] | undefined;
    
    if (!companyId || !productData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: companyId and productData'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company's Gemini API key
    console.log('[ai-hazard-generator] Fetching company API keys');
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('*')
      .eq('company_id', companyId)
      .eq('key_type', 'gemini');

    if (apiKeyError || !apiKeys || apiKeys.length === 0) {
      console.error('[ai-hazard-generator] No Gemini API key found:', apiKeyError);
      return new Response(JSON.stringify({
        success: false,
        error: 'No Gemini API key configured for this company. Please add one in Settings > API Keys.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt the API key
    const encryptedKey = apiKeys[0].encrypted_key;
    const ENCRYPTION_KEY = 'medtech-api-key-2024';
    
    let geminiApiKey: string;
    try {
      if (encryptedKey.startsWith('AIza')) {
        geminiApiKey = encryptedKey; // Already plain text
      } else {
        const base64Decoded = atob(encryptedKey);
        geminiApiKey = Array.from(base64Decoded)
          .map((char, index) => 
            String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
          )
          .join('');
      }
    } catch (error) {
      console.error('[ai-hazard-generator] Error decrypting API key:', error);
      geminiApiKey = encryptedKey; // Use as-is if decryption fails
    }

    console.log('[ai-hazard-generator] Generating hazards with Gemini');
    
    // Build category instruction based on filter
    const allCategories = [
      { key: 'mechanical_energy', label: 'Mechanical / Structural Hazards (pinch points, crushing, moving parts, frame failure)' },
      { key: 'thermal_energy', label: 'Thermal Energy Hazards (surface temperature, burns, overheating)' },
      { key: 'electrical_energy', label: 'Electrical Energy Hazards (shock, leakage current, insulation failure)' },
      { key: 'radiation', label: 'Radiation Hazards — Ionizing & Non-Ionizing (EMF, laser, UV, X-ray)' },
      { key: 'acoustic_energy', label: 'Acoustic Energy Hazards (noise, ultrasound)' },
      { key: 'chemical_hazards', label: 'Chemical Hazards (toxic substances, off-gassing, chemical burns)' },
      { key: 'biocompatibility', label: 'Biocompatibility Hazards (allergic reaction, cytotoxicity, sensitization)' },
      { key: 'materials_patient_contact', label: 'Materials & Patient Contact' },
      { key: 'combination_other_products', label: 'Hazards in Combination with other Medical products' },
      { key: 'human_factors', label: 'Human Factors' },
      { key: 'training_requirements', label: 'Training Requirements' },
      { key: 'cleaning_maintenance', label: 'Cleaning & Maintenance' },
      { key: 'negative_air_pressure', label: 'Use of Negative Air Pressure Energy' },
      { key: 'sterility_requirements', label: 'Requirements for Sterility' },
      { key: 'critical_data_storage', label: 'Storage of Critical Data' },
      { key: 'software_use', label: 'Use of Software' },
      { key: 'disposal', label: 'Disposal' },
      { key: 'manufacturing_residues', label: 'Manufacturing Methods and Residues' },
      { key: 'transport_storage', label: 'Transport and Storage' },
      { key: 'shelf_life', label: 'Shelf-life and In Use Life' },
      { key: 'product_realization', label: 'Planning of product realization' },
      { key: 'customer_requirements', label: 'Determination of Customer Requirements and Customer Communication' },
      { key: 'purchasing', label: 'Purchasing' },
      { key: 'service_provision', label: 'Product and Service Provision' },
      { key: 'monitoring_devices', label: 'Control of Monitoring and Measuring Devices' },
    ];

    let categoryInstruction: string;
    let hazardCount: string;
    if (categoryFilter) {
      const filtered = allCategories.find(c => c.key === categoryFilter);
      categoryInstruction = `Focus EXCLUSIVELY on this single category and generate all hazards with this category key:\n- ${categoryFilter} - ${filtered?.label || categoryFilter}`;
      hazardCount = '8-12';
    } else {
      categoryInstruction = `Generate hazards covering these 19 categories (use category keys exactly as shown):\n${allCategories.map((c, i) => `${i + 1}. ${c.key} - ${c.label}`).join('\n')}`;
      hazardCount = '12-15';
    }

    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING HAZARDS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map(item => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW hazards that are substantially different from the above.`
      : '';

    // Create comprehensive prompt for hazard identification
    const prompt = `You are an expert medical device risk management consultant specializing in ISO 14971 hazard identification and analysis.${existingItemsSection}

CRITICAL: You must analyze the existing requirement specifications below to identify hazards that could arise from these specific requirements. Each hazard should directly relate to potential failures or risks inherent in the stated requirements.

Based on the following medical device information and existing requirement specifications, identify ${hazardCount} specific hazards:

Product Information:
- Product Name: ${productData.product_name || 'Not specified'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Indications for Use: ${productData.indications_for_use || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Duration of Use: ${productData.duration_of_use || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

Existing Requirement Specifications:
${requirementSpecifications.length > 0 ? requirementSpecifications.map(req => 
  `- ${req.requirement_id}: ${req.description} (Category: ${req.category}) ${req.linked_risks ? 'Known Risks: ' + req.linked_risks : ''}`
).join('\n') : 'No requirement specifications available'}

${categoryInstruction}

Each hazard should:
- Be specific to the device and its intended use
- Consider the existing requirement specifications and their linked risks
- Include potential failure modes or misuse scenarios related to the requirements
- Consider the target user population and environment
- Follow ISO 14971 hazard identification principles
- Include the complete risk analysis chain

Return your response as a JSON object with this exact structure:
{
  "suggestions": [
    {
      "description": "Brief identification of the hazard source (e.g., 'Electrical energy from exposed contacts')",
      "hazardous_situation": "Detailed circumstance where person/property/environment is exposed to the hazard (e.g., 'User contacts live electrical parts during device maintenance')",
      "potential_harm": "Specific injury or damage that could result (e.g., 'Electric shock leading to cardiac arrhythmia or burns')",
      "foreseeable_sequence_events": "Chain of events from hazard to harm (e.g., 'Maintenance panel opened → Protective barrier bypassed → User touches live conductor → Electric current flows through body')",
      "rationale": "Brief explanation of why this hazard is relevant and likely for this device type, considering the requirement specifications",
      "confidence": 0.9,
      "category": "materials_patient_contact|combination_other_products|human_factors|training_requirements|cleaning_maintenance|negative_air_pressure|electrical_energy|sterility_requirements|critical_data_storage|software_use|disposal|manufacturing_residues|transport_storage|shelf_life|product_realization|customer_requirements|purchasing|service_provision|monitoring_devices"
    }
  ]
}

Ensure each suggestion has a confidence score between 0.7 and 1.0 based on how likely and significant the hazard is for this specific device type and its requirements.${outputLanguage && outputLanguage !== 'en' ? `\n\nIMPORTANT: Generate ALL output text (descriptions, rationale, etc.) in ${outputLanguage === 'de' ? 'German (Deutsch)' : outputLanguage === 'fr' ? 'French (Français)' : outputLanguage === 'fi' ? 'Finnish (Suomi)' : outputLanguage}. Keep JSON keys in English.` : ''}${additionalPrompt ? `\n\nAdditional instructions from the user:\n${additionalPrompt}` : ''}`;

    // Call Gemini API (exactly like user needs generator)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      }),
    });

    console.log(`[ai-hazard-generator] Gemini API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-hazard-generator] Gemini API error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('[ai-hazard-generator] No text content in response:', JSON.stringify(data));
      return new Response(JSON.stringify({
        success: false,
        error: 'No content generated by AI'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('[ai-hazard-generator] Raw Gemini response:', generatedText);

    // Parse the AI response with better error handling for truncated responses
    let suggestions: HazardSuggestion[];
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      
      // Check if response is truncated and try to fix it
      if (!cleanResponse.endsWith('}') && !cleanResponse.endsWith(']')) {
        console.log('[ai-hazard-generator] Response appears truncated, attempting to fix...');
        
        // Try to find the last complete suggestion
        const lastCompleteMatch = cleanResponse.match(/.*},\s*{[^}]*$/);
        if (lastCompleteMatch) {
          // Remove the incomplete suggestion and close the array/object properly
          cleanResponse = cleanResponse.substring(0, lastCompleteMatch.index + lastCompleteMatch[0].indexOf('},') + 1);
          if (cleanResponse.includes('"suggestions":[')) {
            cleanResponse += ']}';
          } else {
            cleanResponse += ']';
          }
        } else {
          // Find the last complete closing brace
          const lastBraceIndex = cleanResponse.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            cleanResponse = cleanResponse.substring(0, lastBraceIndex + 1);
            if (cleanResponse.includes('"suggestions":[')) {
              cleanResponse += ']}';
            } else {
              cleanResponse += ']';
            }
          }
        }
      }
      
      const parsedResponse = JSON.parse(cleanResponse);
      
      // Handle both direct array and object with suggestions array
      if (Array.isArray(parsedResponse)) {
        suggestions = parsedResponse;
      } else if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
        suggestions = parsedResponse.suggestions;
      } else {
        throw new Error('Response format not recognized');
      }
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('[ai-hazard-generator] Failed to parse AI response:', parseError);
      console.error('[ai-hazard-generator] Raw response was:', generatedText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to parse AI response - response may be truncated due to length'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ai-hazard-generator] Generated', suggestions.length, 'hazards');

    return new Response(JSON.stringify({
      success: true,
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        productName: productData.product_name,
        totalSuggestions: suggestions.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-hazard-generator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType: errorName
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});