import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Field = "description" | "justification";

const FIELD_GUIDANCE: Record<Field, string> = {
  description:
    "Draft a precise, specific Change Control Request description: what is changing, where (which document/process/component), and why now. Plain prose, 80-150 words, no headers, no preamble.",
  justification:
    "Draft a regulator-ready justification linking the change to its trigger (CAPA, complaint, audit finding, design improvement, regulatory update). State the risk of NOT making the change. Plain prose, 80-140 words, no headers, no preamble.",
};

interface Body {
  field: Field;
  companyId: string;
  productId?: string | null;
  title?: string;
  changeType?: string;
  sourceType?: string;
  sourceReference?: string;
  affectedDocumentIds?: string[];
  affectedDocumentNames?: string[];
  targetObjectType?: string;
  targetObjectLabel?: string;
  userInstructions?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const { field, companyId } = body;

    if (!field || !FIELD_GUIDANCE[field] || !companyId) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Light company / product context (best-effort)
    let companyName = "";
    try {
      const { data: c } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .maybeSingle();
      companyName = (c as any)?.name ?? "";
    } catch (_) {}

    let productContext = "";
    if (body.productId) {
      try {
        const { data: p } = await supabase
          .from("products")
          .select("name, device_class")
          .eq("id", body.productId)
          .maybeSingle();
        if (p) {
          productContext = `Product: ${(p as any).name} (Class ${(p as any).device_class ?? "N/A"})`;
        }
      } catch (_) {}
    }

    // Resolve up to 30 affected document names if only IDs were supplied
    let docNames = body.affectedDocumentNames ?? [];
    if ((!docNames || docNames.length === 0) && body.affectedDocumentIds?.length) {
      try {
        const ids = body.affectedDocumentIds.slice(0, 30);
        const [{ data: cd }, { data: pd }] = await Promise.all([
          supabase.from("company_documents").select("id, name, document_type").in("id", ids),
          supabase.from("product_documents").select("id, name, document_type").in("id", ids),
        ]);
        docNames = [
          ...((cd as any[]) ?? []).map((d) => `${d.name} (${d.document_type ?? "doc"})`),
          ...((pd as any[]) ?? []).map((d) => `${d.name} (${d.document_type ?? "doc"})`),
        ];
      } catch (_) {}
    }

    const summaryLines: string[] = [];
    if (companyName) summaryLines.push(`Company: ${companyName}`);
    if (productContext) summaryLines.push(productContext);
    if (body.title) summaryLines.push(`Title: ${body.title}`);
    if (body.changeType) summaryLines.push(`Change Type: ${body.changeType}`);
    if (body.sourceType) summaryLines.push(`Source Type: ${body.sourceType}`);
    if (body.sourceReference) summaryLines.push(`Source Reference: ${body.sourceReference}`);
    if (body.targetObjectType || body.targetObjectLabel) {
      summaryLines.push(
        `Target Object: ${body.targetObjectType ?? ""} ${body.targetObjectLabel ?? ""}`.trim(),
      );
    }
    if (docNames.length) {
      summaryLines.push(
        `Affected Documents (${docNames.length}):\n${docNames.slice(0, 30).map((n) => `- ${n}`).join("\n")}`,
      );
    }

    const contextPreview = summaryLines.join("\n");

    const systemPrompt = `You are a senior medical device QA/RA expert specialised in ISO 13485 §7.3.9 change control and 21 CFR 820.30(i).
Write practical, regulator-ready content tailored to the specific change request below.
Plain text only — no markdown headers, no code fences, no preamble like "Here is...".
Be concrete: refer to the actual change and the affected items by name where useful, not generic boilerplate.`;

    const trimmedInstructions = (body.userInstructions ?? "").trim();
    const userPrompt = `${contextPreview}

TASK: ${FIELD_GUIDANCE[field]}
${trimmedInstructions ? `\nADDITIONAL USER INSTRUCTIONS: ${trimmedInstructions}\n` : ""}
Return only the field content.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
          temperature: 0.3,
          max_tokens: 600,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const suggestion: string = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion, contextPreview }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-ccr-draft-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});