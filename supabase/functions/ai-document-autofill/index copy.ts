import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackTokenUsage, extractLovableAIUsage } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, sectionTitle, currentContent, companyId, referenceContext, documentName, documentType } = await req.json();
    console.log('[ai-document-autofill] Request received:', { sectionTitle, hasPrompt: !!prompt, companyId, hasReferenceContext: !!referenceContext, documentName, documentType });

    if (!referenceContext) {
      throw new Error('Reference documents are required for auto-fill. Please select at least one reference document.');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert technical writer specializing in medical device documentation and quality management systems.

Your task is to generate content for a specific section of a document using ONLY the reference documents provided below.

RULES:
1. Use ONLY information, facts, data, and terminology that are present in the reference documents. Do NOT invent or fabricate any details.
2. Carefully read ALL the reference document content. Look for any information that could be relevant to the requested section — even if it is not explicitly labeled with the same section name. For example, content about "project boundaries" is relevant to a "Scope" section; content about "team members" or "roles" is relevant to a "Responsibilities" section.
3. If the reference documents contain relevant information for the section, generate well-structured professional content using ONLY that information.
4. If the reference documents contain absolutely NO relevant information for the requested section, respond with ONLY this exact text and nothing else: NO_RELEVANT_CONTENT
5. If only PARTIAL information is available, generate content from what IS available and add a note at the end: <p><em><strong>Note:</strong> The reference documents contain limited information for this section. The following topics may need additional detail: [list topics].</em></p>
6. Structure the content professionally for a medical device QMS document. Reference standards (ISO 13485, FDA 21 CFR Part 820, EU MDR) where the reference documents mention or relate to them.
7. Do NOT use generic placeholder text like "[Insert Company Name]" or "[Insert Product Name]". If specific details are in the reference documents, use them. If not, omit them.
8. Do NOT generate generic boilerplate content that is not grounded in the reference documents.

OUTPUT FORMAT (only when generating content, NOT when responding with NO_RELEVANT_CONTENT):
- Return ONLY raw HTML content — NO markdown, NO code blocks, NO \`\`\`html tags
- Start your response directly with HTML tags like <p>, <ul>, <h3>, etc.
- Do NOT wrap your response in markdown code fences
- Do NOT include any preamble or explanations before the HTML
- Use semantic HTML tags: <p>, <ul>, <ol>, <li>, <h3>, <h4>, <strong>, <em>
- Use proper HTML structure for lists, paragraphs, and headings

--- REFERENCE DOCUMENTS START ---
${referenceContext}
--- REFERENCE DOCUMENTS END ---`;

    const userPrompt = prompt || `Generate content for the "${sectionTitle}" section of the "${documentName || 'Untitled'}" document (type: ${documentType || 'QMS'}). Search the reference documents thoroughly for ANY information relevant to this section. If there is absolutely no relevant information in the reference documents, respond with only: NO_RELEVANT_CONTENT`;

    console.log('[ai-document-autofill] Calling Lovable AI for section:', sectionTitle);

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
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[ai-document-autofill] AI API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('[ai-document-autofill] AI response received for section:', sectionTitle);

    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated by AI');
    }

    // Check if AI found no relevant content in reference docs
    const trimmed = generatedContent.trim();
    if (trimmed === 'NO_RELEVANT_CONTENT' || trimmed === '[NO_RELEVANT_CONTENT]') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No relevant content found in reference documents for "${sectionTitle}"`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Track token usage in background if company_id provided
    if (companyId) {
      const usage = extractLovableAIUsage(aiData);
      if (usage) {
        EdgeRuntime.waitUntil(
          trackTokenUsage(companyId, 'gemini', usage)
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ai-document-autofill] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
