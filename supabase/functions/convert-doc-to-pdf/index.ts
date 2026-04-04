import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { corsHeaders } from '../_shared/cors.ts'

interface ConversionRequest {
  fileBase64: string;
  fileName: string;
}

interface ConversionResponse {
  success: boolean;
  pdfBase64?: string;
  pdfFileName?: string;
  error?: string;
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API secret from environment variable OR use hardcoded value for testing
    const CONVERT_API_SECRET = Deno.env.get('CONVERT_API_SECRET') || 'nxrSFmGnlUW6AMJ6WBvyLPWhfAhOfUB5';

    if (!CONVERT_API_SECRET) {
      console.error('[ConvertDocToPdf] CONVERT_API_SECRET not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ConvertAPI secret not configured. Please add CONVERT_API_SECRET to your Supabase secrets.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileBase64, fileName }: ConversionRequest = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: fileBase64 and fileName are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ConvertDocToPdf] Starting conversion for: ${fileName}`);

    // Determine the source format based on file extension
    const lowerFileName = fileName.toLowerCase();
    const sourceFormat = lowerFileName.endsWith('.docx') ? 'docx' : 'doc';

    // Call ConvertAPI
    const convertApiUrl = `https://v2.convertapi.com/convert/${sourceFormat}/to/pdf`;

    console.log(`[ConvertDocToPdf] Calling ConvertAPI: ${convertApiUrl}`);

    const convertResponse = await fetch(convertApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERT_API_SECRET}`,
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        Parameters: [
          {
            Name: 'File',
            FileValue: {
              Name: fileName,
              Data: fileBase64
            }
          },
          {
            Name: 'StoreFile',
            Value: false
          }
        ]
      })
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error(`[ConvertDocToPdf] ConvertAPI error: ${convertResponse.status} - ${errorText}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: `ConvertAPI error: ${convertResponse.status} - ${errorText}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const convertResult = await convertResponse.json();

    console.log('[ConvertDocToPdf] ConvertAPI response received');

    // Extract the converted PDF
    if (!convertResult.Files || convertResult.Files.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ConvertAPI did not return any files'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdfFile = convertResult.Files[0];
    const pdfFileName = fileName.replace(/\.(doc|docx)$/i, '.pdf');

    console.log(`[ConvertDocToPdf] Conversion successful: ${pdfFileName}, size: ${pdfFile.FileData?.length || 'unknown'} bytes (base64)`);

    const response: ConversionResponse = {
      success: true,
      pdfBase64: pdfFile.FileData,
      pdfFileName: pdfFileName
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ConvertDocToPdf] Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during conversion'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
