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
    const { prompt, sectionTitle, currentContent, companyId, referenceContext, outputLanguage, mode } = await req.json();
    console.log('[ai-content-generator] Request received:', { sectionTitle, hasPrompt: !!prompt, companyId, hasReferenceContext: !!referenceContext, outputLanguage, mode });

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build the AI prompt with context
    const isEditMode = mode === 'edit' && currentContent;
    const isReviewMode = mode === 'review';

    let systemPrompt: string;

    if (isReviewMode) {
      systemPrompt = `You are an expert regulatory and quality reviewer specializing in medical device documentation and quality management systems.

You are REVIEWING existing document content. The user will ask a question about the content.
Provide clear, actionable feedback. Do NOT rewrite the content — give advisory answers only.
Structure your response with headings and bullet points for clarity.

Guidelines:
- Be specific about gaps, issues, or strengths
- Reference relevant standards (ISO 13485, ISO 14971, FDA 21 CFR Part 820, MDR) when applicable
- Use professional medical device industry language
- Return your response as clean HTML with <p>, <ul>, <li>, <h4>, <strong> tags
- Do NOT wrap in markdown code fences

${referenceContext ? `REFERENCE DOCUMENTS:\n${referenceContext}` : ''}
${outputLanguage && outputLanguage !== 'en' ? `CRITICAL: Generate ALL output in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.` : ''}`;
    } else if (isEditMode) {
      systemPrompt = `You are an expert technical writer specializing in medical device documentation and quality management systems.

You are EDITING an existing document section. The user will provide their current content and an instruction.
Modify the existing content according to the instruction.
Preserve the overall structure, tone, and formatting. Only change what the user asks for.
Return the full updated section content.

Guidelines:
- Preserve existing content that is not affected by the instruction
- Maintain professional medical device industry language
- Follow ISO 13485 and FDA 21 CFR Part 820 standards
- CRITICAL: Return ONLY raw HTML content - NO markdown, NO code blocks, NO \`\`\`html tags
- Start your response directly with HTML tags like <p>, <ul>, <h3>, etc.
- Do NOT wrap your response in markdown code fences
- Do NOT include any preamble or explanations

${referenceContext ? `REFERENCE DOCUMENTS:\n${referenceContext}` : ''}
${outputLanguage && outputLanguage !== 'en' ? `CRITICAL: Generate ALL output in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.` : ''}`;
    } else {
      systemPrompt = `You are an expert technical writer specializing in medical device documentation and quality management systems.

Guidelines:
- Use professional medical device industry language
- Follow ISO 13485 and FDA 21 CFR Part 820 standards
- Be specific and actionable
- Include relevant compliance references when appropriate
- Structure content logically with clear sections
- Ensure content is comprehensive yet concise
- CRITICAL: Return ONLY raw HTML content - NO markdown, NO code blocks, NO \`\`\`html tags
- Start your response directly with HTML tags like <p>, <ul>, <h3>, etc.
- Do NOT wrap your response in markdown code fences (\`\`\`html or \`\`\`)
- Do NOT include any preamble, explanations, or introductory text
- Use well-formatted HTML with semantic tags: <p>, <ul>, <ol>, <li>, <h3>, <h4>, <strong>, <em>, <a>
- Use proper HTML structure for lists, paragraphs, and headings
- Make links clickable using <a href="..."> tags where relevant

${referenceContext ? `IMPORTANT: The following reference documents have been provided as context. Use them as the PRIMARY source of truth for generating content. Adapt terminology, structure, and details from these documents.

--- REFERENCE DOCUMENTS ---
${referenceContext}
--- END REFERENCE DOCUMENTS ---` : ''}

${outputLanguage && outputLanguage !== 'en' ? `CRITICAL LANGUAGE INSTRUCTION: Generate ALL output text in ${
  outputLanguage === 'de' ? 'German (Deutsch)' :
  outputLanguage === 'fr' ? 'French (Français)' :
  outputLanguage === 'fi' ? 'Finnish (Suomi)' :
  'English'
}. Every heading, paragraph, list item, and label must be in this language. Do NOT mix languages.` : ''}`;
    }

    const userPrompt = isReviewMode
      ? `Document "${sectionTitle}" content:\n${currentContent}\n\nQuestion: ${prompt}`
      : isEditMode
      ? `Current content of the "${sectionTitle}" section:\n${currentContent}\n\nInstruction: ${prompt}`
      : prompt;

    console.log('[ai-content-generator] Calling Gemini API directly...');

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[ai-content-generator] Gemini API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('[ai-content-generator] Gemini response received');

    const generatedContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      console.error('[ai-content-generator] No content in response:', JSON.stringify(aiData));
      throw new Error('No content generated by AI');
    }

    // Track token usage in background if company_id provided
    if (companyId) {
      const usage = aiData.usageMetadata;
      if (usage) {
        EdgeRuntime.waitUntil(
          trackTokenUsage(companyId, 'gemini', {
            prompt_tokens: usage.promptTokenCount || 0,
            completion_tokens: usage.candidatesTokenCount || 0,
            total_tokens: usage.totalTokenCount || 0,
          })
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
    console.error('[ai-content-generator] Error:', error);
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
