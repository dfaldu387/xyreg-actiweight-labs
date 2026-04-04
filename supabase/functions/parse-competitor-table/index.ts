import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorEntry {
  competitorCompany: string;
  productName: string;
  material?: string;
  areaOfFocus?: string;
  phase?: string;
  regulatoryStatus?: string;
  market?: string;
  launchDate?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionId } = await req.json();
    
    if (!sectionId) {
      throw new Error('sectionId is required');
    }

    console.log('[parse-competitor-table] Starting parsing for section:', sectionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get section with extracted text
    const { data: section, error: sectionError } = await supabase
      .from('document_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (sectionError || !section) {
      throw new Error(`Section not found: ${sectionError?.message}`);
    }

    if (!section.extracted_text) {
      throw new Error('Section has no extracted text. Please extract the section first.');
    }

    console.log('[parse-competitor-table] Section found with', section.extracted_text.length, 'characters of text');

    // Update status to parsing
    await supabase
      .from('document_sections')
      .update({ extraction_status: 'parsed' })
      .eq('id', sectionId);

    // Use AI to parse competitor data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert at extracting competitive intelligence data from market research reports.
Your task is to identify and extract information about competitor companies and their products from the provided text.

Look for:
- Company names (competitors)
- Product names and models
- Materials used (e.g., Titanium, CoCr, PEEK, Polymer)
- Area of focus (e.g., Hip, Spine, Knee, Dental)
- Development phase (e.g., R&D, Clinical Trials, FDA Cleared, CE Marked, Launched, Commercial)
- Regulatory status (e.g., FDA 510(k), FDA PMA, CE Mark, NMPA approved)
- Target markets (e.g., US, EU, Global, China)
- Launch dates or timeline information
- Any additional relevant notes

Extract each competitor product as a separate entry. Be thorough but accurate. If information is not available, leave it blank.`;

    const userPrompt = `Extract competitor information from this market report section:

${section.extracted_text}

Identify all competitor companies and their products with available details.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        tools: [{
          type: 'function',
          function: {
            name: 'extract_competitors',
            description: 'Extract competitor product information from market report',
            parameters: {
              type: 'object',
              properties: {
                competitors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      competitorCompany: { type: 'string', description: 'Company name' },
                      productName: { type: 'string', description: 'Product name or model' },
                      material: { type: 'string', description: 'Material composition if mentioned' },
                      areaOfFocus: { type: 'string', description: 'Clinical area or application' },
                      phase: { type: 'string', description: 'Development or commercialization phase' },
                      regulatoryStatus: { type: 'string', description: 'Regulatory approvals' },
                      market: { type: 'string', description: 'Target market or geography' },
                      launchDate: { type: 'string', description: 'Launch date or timeline' },
                      notes: { type: 'string', description: 'Additional relevant information' }
                    },
                    required: ['competitorCompany', 'productName']
                  }
                }
              },
              required: ['competitors']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_competitors' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      const errorText = await aiResponse.text();
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log('[parse-competitor-table] AI parsing complete');

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('AI did not return structured output');
    }

    const { competitors } = JSON.parse(toolCall.function.arguments);

    // Store extracted data in section
    await supabase
      .from('document_sections')
      .update({
        extracted_data: { competitors, extractedAt: new Date().toISOString() }
      })
      .eq('id', sectionId);

    console.log('[parse-competitor-table] Parsing complete, found', competitors.length, 'competitors');

    return new Response(
      JSON.stringify({ 
        success: true, 
        sectionId,
        competitors,
        count: competitors.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-competitor-table] Error:', error);
    
    // Update section status to failed
    if (error instanceof Error && !error.message.includes('Section not found')) {
      try {
        const { sectionId } = await req.json();
        if (sectionId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await supabase
            .from('document_sections')
            .update({ 
              extraction_status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', sectionId);
        }
      } catch (updateError) {
        console.error('[parse-competitor-table] Failed to update error status:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
