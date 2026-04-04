import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId } = await req.json();
    console.log('[generate-business-canvas] Starting generation for product:', productId);

    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch product data to get company_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, description, company_id')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Product not found');

    console.log('[generate-business-canvas] Product found:', product.name);

    // Get venture blueprint data from product_venture_blueprints
    const { data: blueprintData, error: blueprintError } = await supabase
      .from('product_venture_blueprints')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();

    if (blueprintError) {
      console.error('[generate-business-canvas] Blueprint error:', blueprintError);
      throw new Error('Failed to fetch venture blueprint data');
    }

    if (!blueprintData) {
      throw new Error('No venture blueprint data found for this product. Please complete the Venture Blueprint first.');
    }

    const activityNotes = (blueprintData.activity_notes as Record<number, string>) || {};
    const completedActivities = (blueprintData.completed_activities as number[]) || [];

    console.log('[generate-business-canvas] Venture blueprint data:', {
      totalNotes: Object.keys(activityNotes).length,
      completedActivities: completedActivities.length
    });

    // Step titles for context (steps 1-24)
    const stepTitles: Record<number, string> = {
      1: "Identify Clinical/User Need", 2: "Market & Competitor Analysis", 3: "Core Solution Concept", 4: "User & Economic Buyer Profile",
      5: "Quantified Value Proposition", 6: "Regulatory Assessment", 7: "Technical Feasibility", 8: "Project & Resource Plan",
      9: "User & System Requirements", 10: "Architectural Design", 11: "Detailed Design & Prototyping", 12: "Risk Management",
      13: "Design Verification", 14: "Design Validation", 15: "Manufacturing Validation",
      16: "Regulatory Submission", 17: "Go-to-Market Strategy", 18: "Supply Chain & Production", 19: "Submit for Approval",
      20: "Commercial Launch", 21: "Post-Market Surveillance", 22: "Performance Analysis", 23: "Next Version Planning", 24: "Compliance & Change Management"
    };

    // Define which Venture Blueprint steps map to each Business Canvas section
    const sectionMapping: Record<string, number[]> = {
      customer_segments: [4],           // Step 4: User & Economic Buyer Profile
      value_propositions: [5],          // Step 5: Quantified Value Proposition
      channels: [17],                   // Step 17: Go-to-Market Strategy
      customer_relationships: [17],     // Step 17: Go-to-Market Strategy
      revenue_streams: [17],            // Step 17: Go-to-Market Strategy
      key_resources: [8, 10],           // Steps 8, 10
      key_activities: [9, 11, 12],      // Steps 9, 11, 12
      key_partnerships: [8],            // Step 8
      cost_structure: [8, 18]           // Steps 8, 18
    };

    // Helper to check if a step has meaningful content
    const hasContent = (stepId: number): boolean => {
      const note = activityNotes[stepId];
      return note !== undefined && note !== null && note.trim().length > 0;
    };

    // Check which sections have input data from their mapped steps
    const sectionsWithData: Record<string, { hasData: boolean; steps: number[]; missingSteps: number[] }> = {};
    for (const [section, steps] of Object.entries(sectionMapping)) {
      const stepsWithContent = steps.filter(hasContent);
      const missingSteps = steps.filter(s => !hasContent(s));
      sectionsWithData[section] = {
        hasData: stepsWithContent.length > 0,
        steps,
        missingSteps
      };
    }

    console.log('[generate-business-canvas] Sections with data:', 
      Object.entries(sectionsWithData).map(([k, v]) => `${k}: ${v.hasData}`).join(', ')
    );

    // Build comprehensive context from venture blueprint - only include steps that have content
    const stepsWithNotes = Object.entries(activityNotes)
      .filter(([_, note]) => note && note.trim().length > 0)
      .map(([stepId, note]) => `Step ${stepId} (${stepTitles[Number(stepId)] || 'Unknown'}): ${note}`)
      .join('\n\n');

    const context = `
Device Name: ${product.name}
Device Description: ${product.description || 'Not provided'}

VENTURE BLUEPRINT DATA (only steps with content):
${stepsWithNotes || 'No venture blueprint notes have been entered yet.'}

Completed Steps: ${completedActivities.length > 0 ? completedActivities.join(', ') : 'None'}
    `.trim();

    console.log('[generate-business-canvas] Context length:', context.length);

    // Build section status info for the AI
    const sectionStatusInfo = Object.entries(sectionsWithData)
      .map(([section, info]) => {
        const sectionName = section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (info.hasData) {
          return `- ${sectionName}: HAS INPUT from Step(s) ${info.steps.join(', ')}`;
        } else {
          return `- ${sectionName}: NO INPUT (requires Step(s) ${info.missingSteps.join(', ')}: ${info.missingSteps.map(s => stepTitles[s]).join(', ')})`;
        }
      })
      .join('\n');

    // Create system prompt with strict instructions about missing data
    const systemPrompt = `You are a medical device business strategy expert. Analyze the venture blueprint data and generate a Business Model Canvas for this medical device product.

CRITICAL INSTRUCTION - HONESTY ABOUT MISSING DATA:
For sections that have NO INPUT DATA, you MUST respond with EXACTLY this format:
"⚠️ No input provided. Complete Venture Blueprint Step X (Step Title) to populate this section."

DO NOT make up, fabricate, or extrapolate content for sections without input data.
ONLY use actual content from the provided Venture Blueprint notes.
If a section's mapped steps have no content, indicate this clearly.

SECTION INPUT STATUS:
${sectionStatusInfo}

The Business Model Canvas has 9 building blocks:
1. Customer Segments - Who are the customers? (end users, economic buyers, decision makers) - From Step 4
2. Value Propositions - What value does the product deliver? - From Step 5
3. Channels - How does the product reach customers? - From Step 17
4. Customer Relationships - How do you interact with customers? - From Step 17
5. Revenue Streams - How does the business make money? - From Step 17
6. Key Resources - What assets are required? - From Steps 8, 10
7. Key Activities - What must be done? - From Steps 9, 11, 12
8. Key Partnerships - Who are the partners? - From Step 8
9. Cost Structure - What are the major costs? - From Steps 8, 18

For sections WITH data: Extract relevant information and provide specific, actionable insights.
For sections WITHOUT data: Use the exact warning format specified above.`;

    const userPrompt = `Based on this venture blueprint data for a medical device product, generate a Business Model Canvas:\n\n${context}`;

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_business_canvas",
            description: "Generate Business Model Canvas from venture blueprint data",
            parameters: {
              type: "object",
              properties: {
                customer_segments: { 
                  type: "string",
                  description: "Who are the customers? Include end users, economic buyers, and decision makers."
                },
                value_propositions: { 
                  type: "string",
                  description: "What value does the product deliver? Include measurable benefits and problems solved."
                },
                channels: { 
                  type: "string",
                  description: "How does the product reach customers? Include sales channels and distribution methods."
                },
                customer_relationships: { 
                  type: "string",
                  description: "How do you interact with customers? Include support, feedback mechanisms, and engagement strategies."
                },
                revenue_streams: { 
                  type: "string",
                  description: "How does the business make money? Include pricing model and payment terms."
                },
                key_resources: { 
                  type: "string",
                  description: "What assets are required? Include team, technology, IP, and manufacturing capabilities."
                },
                key_activities: { 
                  type: "string",
                  description: "What must be done? Include development, manufacturing, regulatory, and quality activities."
                },
                key_partnerships: { 
                  type: "string",
                  description: "Who are the key partners? Include suppliers, distributors, and consultants."
                },
                cost_structure: { 
                  type: "string",
                  description: "What are the major costs? Include development, manufacturing, and operational expenses."
                }
              },
              required: [
                "customer_segments", "value_propositions", "channels",
                "customer_relationships", "revenue_streams", "key_resources",
                "key_activities", "key_partnerships", "cost_structure"
              ],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_business_canvas" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error('[generate-business-canvas] AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiResponse = await response.json();
    console.log('[generate-business-canvas] AI response received');

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const canvasData = JSON.parse(toolCall.function.arguments);
    console.log('[generate-business-canvas] Canvas data extracted');

    // Save to database
    const { data: savedCanvas, error: saveError } = await supabase
      .from('business_canvas')
      .upsert({
        product_id: productId,
        customer_segments: canvasData.customer_segments,
        value_propositions: canvasData.value_propositions,
        channels: canvasData.channels,
        customer_relationships: canvasData.customer_relationships,
        revenue_streams: canvasData.revenue_streams,
        key_resources: canvasData.key_resources,
        key_activities: canvasData.key_activities,
        key_partnerships: canvasData.key_partnerships,
        cost_structure: canvasData.cost_structure,
        is_ai_generated: true,
        generated_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      }, {
        onConflict: 'product_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[generate-business-canvas] Save error:', saveError);
      throw saveError;
    }

    console.log('[generate-business-canvas] Canvas saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        canvas: savedCanvas 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[generate-business-canvas] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
