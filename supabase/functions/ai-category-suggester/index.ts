import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, categories, context } = await req.json();

    if (!description || !categories?.length) {
      return new Response(
        JSON.stringify({ error: 'description and categories are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const categoryList = categories.map((c: { id: string; label: string; description: string }) =>
      `- id: "${c.id}", label: "${c.label}", description: "${c.description}"`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: context === 'user-need'
              ? `You are a medical device user needs classification expert following ISO 13485. Given a user need description, select the single best-matching category. Focus on the PRIMARY intent of the need, not incidental keywords. For example, a need about data integrity across modules is "General" or "Design", NOT "Document Management" (which is about document control workflows). Return ONLY the category id, nothing else.`
              : `You are a medical device requirements classification expert. Given a system requirement description, select the single best-matching category from the provided list. Return ONLY the category id, nothing else.`
          },
          {
            role: 'user',
            content: `${context === 'user-need' ? 'User need' : 'Requirement'} description: "${description}"\n\nAvailable categories:\n${categoryList}\n\nReturn only the category id.`
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestedId = data.choices?.[0]?.message?.content?.trim().replace(/['"]/g, '');

    // Validate the suggestion is a valid category id
    const validIds = categories.map((c: { id: string }) => c.id);
    const categoryId = validIds.includes(suggestedId) ? suggestedId : null;

    return new Response(
      JSON.stringify({ categoryId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ai-category-suggester] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
