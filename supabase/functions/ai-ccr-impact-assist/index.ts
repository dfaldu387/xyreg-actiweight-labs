import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Field =
  | "regulatory_impact_description"
  | "implementation_plan"
  | "verification_plan"
  | "description"
  | "justification";

const FIELD_GUIDANCE: Record<Field, string> = {
  regulatory_impact_description:
    "Describe the regulatory impact of this change: which submissions, notifications, or filings are triggered (e.g., MDR Article 120 notification, FDA Letter-to-File vs. Special 510(k), notified body review). Reference the device class and affected jurisdictions where relevant. Be specific and concise (120-180 words).",
  implementation_plan:
    "Draft an Implementation Plan for executing this change per ISO 13485 §7.3.9 / 21 CFR 820.30(i). Cover concrete steps: document updates, design output revisions, training, supplier/process changes, target dates, and ownership. Use a short numbered list (5-8 steps).",
  verification_plan:
    "Draft a Verification Plan to confirm the change has been correctly implemented and that effectiveness has been demonstrated per ISO 13485 §7.3.9. Cover: verification activities, acceptance criteria, evidence/records, responsible role, and re-verification scope (regression / partial re-validation as needed). Use a short numbered list (4-7 items).",
  description:
    "Rewrite/expand the change description so it is precise and specific: what is changing, where (which document/process/component), and why now. Plain prose, 80-150 words, no headers.",
  justification:
    "Draft a regulator-ready justification linking the change to its trigger (CAPA, complaint, audit finding, design improvement, regulatory update). State the risk of NOT making the change. Plain prose, 80-140 words, no headers.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ccrId, field, userInstructions } = (await req.json()) as {
      ccrId: string;
      field: Field;
      userInstructions?: string;
    };

    if (!ccrId || !FIELD_GUIDANCE[field]) {
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

    const { data: ccr, error } = await supabase
      .from("change_control_requests")
      .select(
        "ccr_id, title, description, change_type, risk_impact, regulatory_impact, regulatory_impact_description, cost_impact, implementation_plan, verification_plan, affected_documents, affected_requirements, affected_specifications, company_id"
      )
      .eq("id", ccrId)
      .maybeSingle();

    if (error || !ccr) {
      return new Response(JSON.stringify({ error: "CCR not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Light product context (best-effort)
    let productContext = "";
    try {
      const { data: products } = await supabase
        .from("products")
        .select("name, device_class, intended_purpose_data")
        .eq("company_id", ccr.company_id)
        .limit(3);
      if (products?.length) {
        productContext = products
          .map(
            (p: any) =>
              `- ${p.name} (Class ${p.device_class ?? "N/A"})`
          )
          .join("\n");
      }
    } catch (_) {
      // ignore
    }

    const ccrSummary = `CCR: ${ccr.ccr_id} — ${ccr.title}
Description: ${ccr.description}
Change Type: ${ccr.change_type}
Risk Impact: ${ccr.risk_impact}
Regulatory Impact: ${ccr.regulatory_impact ? "Yes" : "No"}
Cost Impact (USD): ${ccr.cost_impact ?? "N/A"}
Affected Documents: ${JSON.stringify(ccr.affected_documents ?? [])}
Affected Requirements: ${JSON.stringify(ccr.affected_requirements ?? [])}
Affected Specifications: ${JSON.stringify(ccr.affected_specifications ?? [])}
${productContext ? `Company products:\n${productContext}` : ""}`;

    const systemPrompt = `You are a senior medical device QA/RA expert specialised in ISO 13485 §7.3.9 change control and 21 CFR 820.30(i).
Write practical, regulator-ready content tailored to the specific change request below.
Plain text only — no markdown headers, no code fences, no preamble like "Here is...". Numbered lists are fine when requested.
Be concrete: refer to the actual change, not generic boilerplate.`;

    const trimmedInstructions = (userInstructions ?? "").trim();
    const userPrompt = `${ccrSummary}

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
          max_tokens: 700,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const suggestion: string =
      result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion, contextPreview: ccrSummary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-ccr-impact-assist error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});