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
    const { documents, existingDocumentNumbers, companyName } = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(JSON.stringify({ error: "No documents provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build multi-document content summary
    const documentsSummary = documents.map((doc: any, docIdx: number) => {
      const sectionsText = (doc.sections || []).map((s: any, i: number) => {
        const contentText = (s.content || [])
          .map((c: any) => c.content || "")
          .join("\n");
        return `### Section ${i + 1}: ${s.title}\n${contentText}`;
      }).join("\n\n");
      return `# Document ${docIdx + 1}: "${doc.documentName}" (${doc.documentNumber || 'No number'}, Type: ${doc.documentType})\n\n${sectionsText}`;
    }).join("\n\n---\n\n");

    const documentList = documents.map((d: any) => d.documentNumber || d.documentName).join(", ");

    const existingDocsContext = existingDocumentNumbers?.length
      ? `\nAll document numbers in the company registry:\n${existingDocumentNumbers.join(", ")}\n`
      : "\nNo existing documents found in the company registry.\n";

    const systemPrompt = `You are a medical device regulatory document quality reviewer performing CROSS-DOCUMENT validation. You are analyzing ${documents.length} documents together to find issues that only become visible when comparing documents as a set.

Focus on:
1. Cross-references between the selected documents — does Document A reference Document B correctly? Are referenced document numbers valid?
2. Terminology consistency — are the same concepts named consistently across all documents?
3. Regulatory gaps — are there missing cross-references that should exist between related documents (e.g., an SOP should reference its associated forms/templates)?
4. Structural consistency — do related documents follow consistent formatting and section structures?

The company name is: ${companyName || "Unknown"}
Documents being validated: ${documentList}
${existingDocsContext}

You MUST use the report_bulk_validation_findings tool to return your findings as structured data. For each finding, include the sourceDocumentName to identify which document the finding belongs to.`;

    const userPrompt = `Please cross-validate the following ${documents.length} documents and report all cross-document findings:\n\n${documentsSummary}`;

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
              name: "report_bulk_validation_findings",
              description: "Report all cross-document validation findings",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sourceDocumentName: { type: "string", description: "Name of the document where the issue was found" },
                        sectionTitle: { type: "string", description: "Section title where the issue was found" },
                        issueType: {
                          type: "string",
                          enum: ["cross_reference", "regulatory_gap", "terminology", "missing_content", "structural"],
                        },
                        severity: {
                          type: "string",
                          enum: ["error", "warning", "info"],
                        },
                        description: { type: "string", description: "Human-readable description of the cross-document issue" },
                        originalContent: { type: "string", description: "The original content with the issue" },
                        suggestedContent: { type: "string", description: "The suggested corrected content" },
                        unresolvedReference: {
                          type: "string",
                          description: "If cross-reference issue, the document number that doesn't exist. Null otherwise.",
                        },
                      },
                      required: ["sourceDocumentName", "sectionTitle", "issueType", "severity", "description", "originalContent", "suggestedContent"],
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
        tool_choice: { type: "function", function: { name: "report_bulk_validation_findings" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    console.error("ai-bulk-document-validator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
