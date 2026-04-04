import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple decryption function (matches frontend implementation)
function decryptApiKey(encryptedKey: string): string {
  try {
    const ENCRYPTION_KEY = 'medtech-api-key-2024';
    
    // If key looks like a plain text API key, return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-') || encryptedKey.startsWith('claude-')) {
      return encryptedKey;
    }

    // Reverse the process: base64 decode then XOR decrypt
    const base64Decoded = atob(encryptedKey);
    const decrypted = Array.from(base64Decoded)
      .map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return encryptedKey;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emdnCode, description, companyId } = await req.json();
    console.log('[AI Keyword Generator] Request received:', { emdnCode, description, companyId });

    if (!emdnCode || !description || !companyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get available API keys for the company
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('key_type, encrypted_key')
      .eq('company_id', companyId)
      .in('key_type', ['openai', 'gemini', 'anthropic']);

    if (apiKeyError || !apiKeys || apiKeys.length === 0) {
      console.log('[AI Keyword Generator] No API keys found, returning error');
      return new Response(JSON.stringify({
        success: false,
        error: 'No AI API keys available'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Keyword Generator] Found API keys:', apiKeys.map(k => k.key_type));

    // Try OpenAI first
    const openaiKey = apiKeys.find(k => k.key_type === 'openai');
    if (openaiKey) {
      try {
        const decryptedKey = decryptApiKey(openaiKey.encrypted_key);
        console.log('[AI Keyword Generator] Using OpenAI for keyword generation');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a medical device expert. Generate 4-5 relevant search keywords for the given EMDN medical device code and description. Focus on medical terms that would help users find similar devices. Return only a comma-separated list of keywords, nothing else.'
              },
              {
                role: 'user',
                content: `EMDN Code: ${emdnCode}\nDescription: ${description}\n\nGenerate search keywords:`
              }
            ],
            max_tokens: 100,
            temperature: 0.3
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const keywordText = data.choices[0].message.content.trim();
          const keywords = keywordText.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
          
          console.log('[AI Keyword Generator] OpenAI generated keywords:', keywords);
          
          return new Response(JSON.stringify({
            success: true,
            keywords: keywords.slice(0, 5),
            provider: 'openai'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (openaiError) {
        console.error('[AI Keyword Generator] OpenAI error:', openaiError);
      }
    }

    // Fallback: return simple extraction
    console.log('[AI Keyword Generator] All AI services failed, returning simple extraction');
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((word: string) => word.length > 2 && !['and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'from', 'by', 'of', 'the', 'a', 'an'].includes(word))
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .slice(0, 5);

    return new Response(JSON.stringify({
      success: true,
      keywords: words,
      provider: 'fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Keyword Generator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});