# Token Usage Tracking

This guide explains how to implement token usage tracking in edge functions that call AI APIs.

## Overview

Token tracking helps monitor AI API usage across your company's edge functions. Usage data is stored in the `company_api_keys` table and displayed in the Super Admin dashboard.

## For Lovable AI Gateway

When using the Lovable AI Gateway (https://ai.gateway.lovable.dev):

```typescript
import { trackTokenUsage, extractLovableAIUsage } from "../_shared/token-tracking.ts";

// In your edge function:
serve(async (req) => {
  const { companyId, ...otherParams } = await req.json();
  
  // Make your AI call
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [...]
    }),
  });
  
  const data = await response.json();
  
  // Extract and track usage in background
  if (companyId) {
    const usage = extractLovableAIUsage(data);
    if (usage) {
      EdgeRuntime.waitUntil(
        trackTokenUsage(companyId, 'gemini', usage)
      );
    }
  }
  
  // Return your response...
});
```

## For Direct Gemini API

When calling Gemini API directly:

```typescript
import { trackTokenUsage, extractGeminiUsage } from "../_shared/token-tracking.ts";

async function analyzeWithGemini(apiKey: string, prompt: string, companyId: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
      })
    }
  );
  
  const data = await response.json();
  
  // Extract usage metadata
  const usage = extractGeminiUsage(data);
  
  // Track in background
  if (usage && companyId) {
    EdgeRuntime.waitUntil(
      trackTokenUsage(companyId, 'gemini', usage)
    );
  }
  
  // Return your result...
}
```

## Important Notes

1. **Background Processing**: Always use `EdgeRuntime.waitUntil()` to track usage in the background. This prevents tracking from slowing down your API responses.

2. **Company ID Required**: The `companyId` must be passed in the request body. If it's not available, tracking will be skipped (won't cause errors).

3. **API Key Types**: Use the correct key type:
   - `'gemini'` - for Lovable AI Gateway and direct Gemini API
   - `'openai'` - for OpenAI API calls
   - `'anthropic'` - for Anthropic API calls

4. **Automatic Accumulation**: Token counts are automatically accumulated in the database. Each call adds to the existing totals.

5. **Tracked Metrics**:
   - `total_input_tokens` - Sum of all input/prompt tokens
   - `total_output_tokens` - Sum of all output/completion tokens
   - `total_tokens` - Sum of all tokens
   - `total_requests` - Number of API calls made
   - `last_tracked_at` - Timestamp of last tracking update

## Viewing Usage Data

Usage data can be viewed in:
- Super Admin Dashboard → API Key Management → View Usage button
- Database: `company_api_keys.token_usage_data` column

## Edge Functions with Token Tracking

Currently implemented in:
- ✅ ai-content-generator
- ✅ ai-document-summary-compare
- ✅ ai-hardware-requirements-generator
- ✅ ai-software-requirements-generator
- ✅ ai-document-analyzer

To add tracking to other functions, follow the patterns above.
