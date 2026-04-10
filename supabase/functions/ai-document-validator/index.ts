import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sections, documentName, documentType, existingDocumentNumbers, companyName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build document content summary for AI
    const documentSummary = sections.map((s: any, i: number) => {
      const contentText = (s.content || [])
        .map((c: any) => c.content || "")
        .join("\n");
      return `## Section ${i + 1}: ${s.title}\n${contentText}`;
    }).join("\n\n");

    const existingDocsContext = existingDocumentNumbers?.length
      ? `\nExisting document numbers in the company registry:\n${existingDocumentNumbers.join(", ")}\n`
      : "\nNo existing documents found in the company registry.\n";

    const systemPrompt = `You are a medical device regulatory document quality reviewer. You analyze documents for:
1. Cross-references to other documents (SOPs, forms, templates) that don't exist yet in the company's document registry
2. Regulatory compliance gaps (missing required sections, incomplete content for the document type)
3. Terminology inconsistencies within the document
4. Missing or incomplete content that would be expected for this document type
5. Structural issues (sections that seem out of order, duplicated content)

The company name is: ${companyName || "Unknown"}
The document is: "${documentName}" (Type: ${documentType})
${existingDocsContext}

You MUST use the report_validation_findings tool to return your findings as structured data.`;

    const userPrompt = `Please validate the following document and report all findings:\n\n${documentSummary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_validation_findings",
              description: "Report all validation findings for the document",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sectionTitle: { type: "string", description: "Title of the section where the issue was found" },
                        issueType: {
                          type: "string",
                          enum: ["cross_reference", "regulatory_gap", "terminology", "missing_content", "structural"],
                          description: "Type of the validation issue",
                        },
                        severity: {
                          type: "string",
                          enum: ["error", "warning", "info"],
                          description: "Severity: error=blocking, warning=should fix, info=suggestion",
                        },
                        description: { type: "string", description: "Human-readable description of the issue" },
                        originalContent: { type: "string", description: "The original content with the issue (can be a snippet)" },
                        suggestedContent: { type: "string", description: "The suggested corrected content" },
                        unresolvedReference: {
                          type: "string",
                          description: "If this is a cross-reference issue, the document number that doesn't exist yet (e.g. SOP-QA-002). Null otherwise.",
                        },
                      },
                      required: ["sectionTitle", "issueType", "severity", "description", "originalContent", "suggestedContent"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["findings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_validation_findings" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured findings");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ findings: parsed.findings || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-document-validator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
