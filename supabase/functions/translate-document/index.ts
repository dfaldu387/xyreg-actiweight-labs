import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callGemini, LovableAIError } from "../_shared/lovable-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  sourceCiId: string;
  targetLang: string; // ISO 2-letter, e.g. "FR"
}

function strReplaceTranslated(html: string): string {
  // Strip code fences if Gemini wrapped output in ```html ... ```
  return html.replace(/^```(?:html)?\n?/i, "").replace(/```\s*$/i, "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json()) as Body;
    if (!body.sourceCiId || !body.targetLang) {
      return new Response(JSON.stringify({ error: "sourceCiId and targetLang required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const targetLang = body.targetLang.toUpperCase();

    // Load source CI
    const { data: sourceCi, error: ciErr } = await supabase
      .from("phase_assigned_document_template")
      .select("*")
      .eq("id", body.sourceCiId)
      .maybeSingle();
    if (ciErr || !sourceCi) {
      return new Response(JSON.stringify({ error: "Source document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block re-translating into the same language
    const sourceLang = (sourceCi.language as string | null)?.toUpperCase() || "EN";
    if (sourceLang === targetLang) {
      return new Response(JSON.stringify({ error: `Source is already in ${targetLang}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load latest content snapshot (document_studio_templates row)
    const { data: studioRows } = await supabase
      .from("document_studio_templates")
      .select("*")
      .eq("company_id", sourceCi.company_id)
      .eq("template_id", sourceCi.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    const sourceStudio = studioRows?.[0];
    console.log("[translate-document] source studio row:", sourceStudio ? `${sourceStudio.id} (${(sourceStudio.sections as unknown[] | null)?.length ?? 0} sections)` : "NONE");

    // Build prompt
    const sectionsText = sourceStudio?.sections
      ? JSON.stringify(sourceStudio.sections)
      : "";
    if (!sectionsText) {
      console.warn("[translate-document] No source content found in document_studio_templates — translation will be skipped and the new draft will use a single placeholder section.");
    }

    const prompt =
      `Translate the following medical-device QMS document into ${targetLang}.\n\n` +
      `RULES:\n` +
      `- Preserve every section heading, numbering, [Placeholders] (in square brackets) and HTML/JSON structure exactly.\n` +
      `- Translate prose only, never the keys, tag names, IDs, or [Placeholders].\n` +
      `- Keep regulatory terminology accurate to the target language (e.g. CE-Kennzeichnung in DE, marquage CE in FR).\n\n` +
      `Title: ${sourceCi.name}\n\n` +
      `Sections JSON:\n${sectionsText}`;

    let translatedRaw = "";
    if (sectionsText) {
      try {
        translatedRaw = await callGemini({
          prompt,
          temperature: 0.2,
          maxOutputTokens: 8192,
          jsonOutput: true,
        });
      } catch (e) {
      console.error("Translation engine error", e);
      const status = e instanceof LovableAIError ? e.status : 502;
      const message = e instanceof Error ? e.message : "Translation engine error";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      }
    }

    let translatedSections: unknown = null;
    try {
      if (translatedRaw) translatedSections = JSON.parse(strReplaceTranslated(translatedRaw));
    } catch {
      translatedSections = sourceStudio?.sections ?? null;
    }
    // Validate shape: must be a non-empty array of section objects
    const sectionsForInsert: unknown[] = Array.isArray(translatedSections) && translatedSections.length > 0
      ? translatedSections as unknown[]
      : (Array.isArray(sourceStudio?.sections) ? sourceStudio!.sections as unknown[] : [
          { id: 'translated_content', title: 'Translated Content', content: [
            { type: 'paragraph', content: '<p><em>Translated content was not generated. Please add content manually.</em></p>' }
          ] },
        ]);
    console.log("[translate-document] sections for insert:", sectionsForInsert.length);

    // Translate the title separately, short call
    let translatedTitle = sourceCi.name as string;
    try {
      const titleOut = await callGemini({
        prompt: `Translate this medical-device document title into ${targetLang}. Return ONLY the translated title, no quotes, no explanation:\n\n${sourceCi.name}`,
        temperature: 0.1,
        maxOutputTokens: 200,
      });
      if (titleOut && titleOut.length < 300) translatedTitle = titleOut.trim().replace(/^"|"$/g, "");
    } catch {
      // keep original title on failure
    }

    // Build new document number with -<LANG> suffix
    const baseNumber: string | null = sourceCi.document_number ?? null;
    const newNumber = baseNumber ? `${baseNumber}-${targetLang}` : null;

    // Create new CI as a child
    const newCiPayload: Record<string, unknown> = {
      company_id: sourceCi.company_id,
      product_id: sourceCi.product_id,
      phase_id: sourceCi.phase_id,
      name: translatedTitle,
      document_type: sourceCi.document_type,
      sub_section: sourceCi.sub_section,
      section_ids: sourceCi.section_ids,
      tags: sourceCi.tags,
      is_record: sourceCi.is_record,
      document_number: newNumber,
      status: "Draft",
      language: targetLang,
      ai_translated: true,
      needs_review: true,
      derived_from_ci_id: sourceCi.id,
      derivation_type: "translation",
    };

    const { data: newCi, error: insertErr } = await supabase
      .from("phase_assigned_document_template")
      .insert(newCiPayload as any)
      .select()
      .single();

    if (insertErr || !newCi) {
      console.error("Insert CI failed", insertErr);
      return new Response(JSON.stringify({ error: "Could not create translated CI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist translated content as a new studio template row
    // ALWAYS persist a studio row for the new CI so the drawer hydrates content.
    // The studio table requires NOT NULL: company_id, template_id (text), name, type, sections, metadata.
    const studioCopy: Record<string, unknown> = {
      company_id: sourceCi.company_id,
      product_id: sourceCi.product_id ?? sourceStudio?.product_id ?? null,
      template_id: newCi.id, // text column, UUID is fine
      name: translatedTitle,
      type: (sourceStudio?.type as string | undefined) ?? (sourceCi.document_type as string | undefined) ?? 'document',
      sections: sectionsForInsert,
      product_context: sourceStudio?.product_context ?? null,
      document_control: sourceStudio?.document_control ?? null,
      metadata: {
        ...((sourceStudio?.metadata as Record<string, unknown> | null) ?? {}),
        ai_translated: true,
        translated_from_ci_id: sourceCi.id,
        translation_target_lang: targetLang,
      },
    };
    const { error: studioInsertErr } = await supabase
      .from("document_studio_templates")
      .insert(studioCopy as any);
    if (studioInsertErr) {
      console.error("[translate-document] studio insert failed", studioInsertErr);
      return new Response(JSON.stringify({
        error: `Translated CI created but content could not be saved: ${studioInsertErr.message}`,
        newCiId: newCi.id,
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.log("[translate-document] studio row inserted for new CI", newCi.id);

    // Update parent's language_variants pointer
    const existingVariants =
      (sourceCi.language_variants as Record<string, string> | null) ?? {};
    existingVariants[targetLang] = newCi.id;
    await supabase
      .from("phase_assigned_document_template")
      .update({ language_variants: existingVariants } as any)
      .eq("id", sourceCi.id);

    return new Response(
      JSON.stringify({
        success: true,
        newCiId: newCi.id,
        newDocumentNumber: newNumber,
        newName: translatedTitle,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("translate-document fatal", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});