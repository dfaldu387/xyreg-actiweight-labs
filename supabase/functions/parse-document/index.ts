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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pages = formData.get('pages') as string; // e.g., "1-50" or "47-62"
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('[parse-document] Parsing file:', file.name, 'pages:', pages || 'all');

    // For now, we'll use a simple text extraction
    // In production, you'd use a PDF parsing library like pdf-parse
    // This is a placeholder that simulates PDF text extraction
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simulate PDF text extraction
    // In reality, you would use a proper PDF parsing library
    const mockText = `[Extracted text from ${file.name}, pages ${pages || 'all'}]
    
This is a simulated extraction. In production, this would contain the actual text
extracted from the PDF using a proper PDF parsing library.

The text would include headers, paragraphs, tables, and other content from the
specified page range.`;

    console.log('[parse-document] Extraction complete');

    return new Response(
      JSON.stringify({ 
        success: true,
        text: mockText,
        fileName: file.name,
        pages: pages || 'all'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-document] Error:', error);
    
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
