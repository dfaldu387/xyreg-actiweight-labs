import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionId } = await req.json();
    
    if (!sectionId) {
      throw new Error('sectionId is required');
    }

    console.log('[extract-document-section] Starting extraction for section:', sectionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get section info
    const { data: section, error: sectionError } = await supabase
      .from('document_sections')
      .select('*, product_competitor_documents(*)')
      .eq('id', sectionId)
      .single();

    if (sectionError || !section) {
      throw new Error(`Section not found: ${sectionError?.message}`);
    }

    const document = section.product_competitor_documents;
    console.log('[extract-document-section] Section found:', section.section_title, `(pages ${section.page_start}-${section.page_end})`);

    // Update status to extracting
    await supabase
      .from('document_sections')
      .update({ extraction_status: 'extracting' })
      .eq('id', sectionId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('[extract-document-section] File downloaded, extracting pages...');

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Parse specific page range using document parser
    const formData = new FormData();
    formData.append('file', new Blob([uint8Array], { type: 'application/pdf' }), document.file_name);
    formData.append('pages', `${section.page_start}-${section.page_end}`);

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
    console.log('[extract-document-section] Extracted text length:', extractedText?.length || 0);

    // Update section with extracted text
    await supabase
      .from('document_sections')
      .update({
        extraction_status: 'extracted',
        extracted_text: extractedText
      })
      .eq('id', sectionId);

    console.log('[extract-document-section] Extraction complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        sectionId,
        extractedText,
        pageRange: `${section.page_start}-${section.page_end}`,
        textLength: extractedText?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-document-section] Error:', error);
    
    // Update section status to failed
    if (error instanceof Error && error.message.includes('Section not found')) {
      // Don't update status if section doesn't exist
    } else {
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
        console.error('[extract-document-section] Failed to update error status:', updateError);
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
