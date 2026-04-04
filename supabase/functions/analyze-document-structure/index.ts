import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentSection {
  title: string;
  type: string;
  pageStart: number;
  pageEnd: number;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    if (!documentId) {
      throw new Error('documentId is required');
    }

    console.log('[analyze-document-structure] Starting analysis for document:', documentId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document info
    const { data: document, error: docError } = await supabase
      .from('product_competitor_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    console.log('[analyze-document-structure] Document found:', document.file_name);

    // Update status to analyzing
    await supabase
      .from('product_competitor_documents')
      .update({ processing_status: 'analyzing' })
      .eq('id', documentId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('[analyze-document-structure] File downloaded, parsing first 50 pages...');

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Parse first 50 pages using document parser
    const formData = new FormData();
    formData.append('file', new Blob([uint8Array], { type: 'application/pdf' }), document.file_name);
    formData.append('pages', '1-50');

    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      throw new Error(`Document parsing failed: ${errorText}`);
    }

    const { text: extractedText } = await parseResponse.json();
    console.log('[analyze-document-structure] Extracted text length:', extractedText?.length || 0);

    // Use AI to analyze document structure
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert document analyzer specializing in market research and competitive intelligence reports. 
Your task is to analyze the first 50 pages of a document and identify major sections with their page ranges.

Look for:
- Executive Summary
- Market Overview / Market Analysis
- Competitive Landscape / Competitor Analysis
- Technology Trends
- Financial Analysis / Market Size
- Growth Opportunities
- Regional Analysis
- Future Outlook / Projections

For each section you identify, provide:
1. A clear title
2. Section type (one of: executive_summary, market_overview, competitive_landscape, technology_trends, financial_analysis, growth_opportunities, regional_analysis, future_outlook, other)
3. Page start number
4. Page end number (estimate based on content)
5. Confidence level (0-1) of your identification

Be specific and accurate. If you see a table of contents, use it. Otherwise, analyze headers and content flow.`;

    const userPrompt = `Analyze this document excerpt (first 50 pages) and identify major sections:

${extractedText.substring(0, 15000)}

Return a structured analysis of document sections with page ranges.`;

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
            name: 'identify_document_sections',
            description: 'Identify major sections in the document with page ranges',
            parameters: {
              type: 'object',
              properties: {
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Section title as it appears in document' },
                      type: { 
                        type: 'string', 
                        enum: ['executive_summary', 'market_overview', 'competitive_landscape', 'technology_trends', 'financial_analysis', 'growth_opportunities', 'regional_analysis', 'future_outlook', 'other'],
                        description: 'Category of the section'
                      },
                      pageStart: { type: 'number', description: 'Starting page number' },
                      pageEnd: { type: 'number', description: 'Ending page number' },
                      confidence: { type: 'number', description: 'Confidence level 0-1' }
                    },
                    required: ['title', 'type', 'pageStart', 'pageEnd', 'confidence']
                  }
                }
              },
              required: ['sections']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'identify_document_sections' } }
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
    console.log('[analyze-document-structure] AI analysis complete');

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('AI did not return structured output');
    }

    const { sections } = JSON.parse(toolCall.function.arguments);

    // Store sections in database
    const documentStructure = {
      totalPages: 50,
      analyzedPages: 50,
      sections: sections,
      generatedAt: new Date().toISOString()
    };

    await supabase
      .from('product_competitor_documents')
      .update({
        processing_status: 'toc_generated',
        document_structure: documentStructure
      })
      .eq('id', documentId);

    // Insert section records
    for (const section of sections) {
      await supabase
        .from('document_sections')
        .insert({
          document_id: documentId,
          section_title: section.title,
          section_type: section.type,
          page_start: section.pageStart,
          page_end: section.pageEnd,
          extraction_status: 'identified'
        });
    }

    console.log('[analyze-document-structure] Analysis complete, found', sections.length, 'sections');

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        structure: documentStructure,
        sectionsFound: sections.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-document-structure] Error:', error);
    
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
