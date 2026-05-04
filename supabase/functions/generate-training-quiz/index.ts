import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a senior medical-device QA trainer building an effectiveness check for an SOP/Work Instruction.
Write 10 multiple-choice questions that focus ONLY on Critical-to-Quality (CtQ) steps — steps that, if skipped or done wrong, would create a non-conformity, regulatory finding, or patient harm.
Avoid trivia (formatting, font sizes, who signs first). Questions must be unambiguous and answerable from the SOP text.
Each question has exactly 4 options, one correct. Provide a 1-2 sentence explanation pointing to why this step matters (regulatory/quality impact).`;

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const { module_id } = await req.json();
      if (!module_id || typeof module_id !== "string") {
        return json({ error: "module_id is required" }, 400);
      }

      const url = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

      const supa = createClient(url, serviceKey);

      const { data: mod, error: modErr } = await supa
        .from("training_modules")
        .select("id, name, description, version, source_document_id, company_id")
        .eq("id", module_id)
        .single();
      if (modErr || !mod) return json({ error: "module not found" }, 404);

      let sopText = mod.description ?? "";
      if (mod.source_document_id) {
        const { data: doc } = await supa
          .from("documents")
          .select("name, brief_summary, description")
          .eq("id", mod.source_document_id)
          .single();
        if (doc) sopText = `${doc.name}\n\n${doc.brief_summary ?? ""}\n\n${doc.description ?? ""}`.trim();
      }
      if (!sopText || sopText.length < 50) {
        sopText = `${mod.name}\n${mod.description ?? ""}`;
      }

      const aiResp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `SOP / Work Instruction title: ${mod.name}\nVersion: ${mod.version}\n\nSource content:\n${sopText.slice(0, 12000)}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "save_quiz",
                  description: "Save 10 CtQ-focused multiple-choice questions",
                  parameters: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        minItems: 10,
                        maxItems: 10,
                        items: {
                          type: "object",
                          properties: {
                            question: { type: "string" },
                            options: {
                              type: "array",
                              minItems: 4,
                              maxItems: 4,
                              items: { type: "string" },
                            },
                            correct_index: { type: "integer", minimum: 0, maximum: 3 },
                            explanation: { type: "string" },
                          },
                          required: ["question", "options", "correct_index", "explanation"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["questions"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "save_quiz" } },
          }),
        }
      );

      if (!aiResp.ok) {
        if (aiResp.status === 429) return json({ error: "Rate limit exceeded, please try again later." }, 429);
        if (aiResp.status === 402) return json({ error: "Credits exhausted — top up your Lovable AI workspace." }, 402);
        const t = await aiResp.text();
        console.error("AI gateway error", aiResp.status, t);
        return json({ error: "AI gateway error" }, 502);
      }

      const aiJson = await aiResp.json();
      const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) return json({ error: "AI did not return tool call" }, 502);
      const args = JSON.parse(call.function.arguments);
      const questions: Array<{
        question: string;
        options: string[];
        correct_index: number;
        explanation: string;
      }> = args.questions ?? [];

      // Replace existing questions
      await supa.from("training_quiz_questions").delete().eq("module_id", module_id);
      const rows = questions.map((q, i) => ({
        module_id,
        company_id: mod.company_id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        order_index: i,
      }));
      const { error: insErr } = await supa.from("training_quiz_questions").insert(rows);
      if (insErr) {
        console.error("insert error", insErr);
        return json({ error: insErr.message }, 500);
      }

      return json({ count: rows.length });
    } catch (e) {
      console.error(e);
      return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
    }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}