import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callGemini, LovableAIError } from "../_shared/lovable-ai.ts";
import { XYREG_FEATURE_MAP, ALL_MODULE_KEYS } from "../_shared/xyregFeatureMap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  sourceCiId: string;
  /** Optional override; if omitted, the server auto-detects modules from SOP content. */
  modules?: string[];
  focus?: string;
  /** Deprecated — feature map now lives server-side. Ignored if sent. */
  featureMap?: Record<string, unknown>;
}

interface WIStep {
  step: number;
  title: string;
  detail: string;
  note?: string;
  caution?: string;
}

interface WIPayload {
  title: string;
  scope: string;
  roles: string[];
  steps: WIStep[];
  acceptance: string[];
  notes?: string[];
  cautions?: string[];
}

function stripFence(s: string) {
  return s.replace(/^```(?:json)?\n?/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * Ask the AI to classify which XyReg modules a given SOP touches.
 * Returns an array of module keys from ALL_MODULE_KEYS. Falls back to
 * a heuristic if the AI returns nothing usable.
 */
async function detectModules(
  sopName: string,
  sopSectionsText: string,
): Promise<string[]> {
  const moduleCatalog = ALL_MODULE_KEYS.map(
    (k) => `- ${k}: ${XYREG_FEATURE_MAP[k].label} (${XYREG_FEATURE_MAP[k].path})`,
  ).join("\n");

  const prompt =
    `You are classifying which modules of the XyReg medical-device QMS application a Standard Operating Procedure (SOP) touches.\n\n` +
    `Available module keys:\n${moduleCatalog}\n\n` +
    `Return ONLY a JSON array of module keys (subset of the keys above) that this SOP touches when executed in XyReg. No prose, no markdown.\n\n` +
    `SOP TITLE: ${sopName}\n` +
    `SOP CONTENT (truncated JSON):\n${sopSectionsText.slice(0, 12000)}\n`;

  try {
    const raw = await callGemini({
      prompt,
      temperature: 0.1,
      maxOutputTokens: 200,
      jsonOutput: true,
    });
    const parsed = JSON.parse(stripFence(raw));
    const allowed = new Set(ALL_MODULE_KEYS);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.modules) ? parsed.modules : [];
    const filtered = arr.filter((k: unknown): k is string => typeof k === "string" && allowed.has(k));
    if (filtered.length > 0) return filtered;
  } catch (e) {
    console.warn("[generate-work-instruction] module detection failed, using heuristic", e);
  }

  // Heuristic fallback
  const t = `${sopName} ${sopSectionsText}`.toLowerCase();
  const hits: string[] = [];
  if (/document|control of documents|sop|record/.test(t)) hits.push("documents");
  if (/risk|hazard|14971/.test(t)) hits.push("risk");
  if (/verification|validation|v&v|test/.test(t)) hits.push("vv");
  if (/capa|corrective|preventive|complaint|nonconform/.test(t)) hits.push("capa");
  if (/training|competen/.test(t)) hits.push("training");
  if (/supplier|purchasing|outsourc/.test(t)) hits.push("suppliers");
  if (/management review|mission|kpi/.test(t)) hits.push("missionControl");
  if (/gap|assessment|13485|mdr|fda|iso/.test(t)) hits.push("gapAnalysis");
  return hits.length > 0 ? hits : ["documents"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json()) as Body;
    if (!body.sourceCiId) {
      return new Response(JSON.stringify({ error: "sourceCiId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sourceCi } = await supabase
      .from("phase_assigned_document_template")
      .select("*")
      .eq("id", body.sourceCiId)
      .maybeSingle();
    if (!sourceCi) {
      return new Response(JSON.stringify({ error: "Source SOP not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: studioRows } = await supabase
      .from("document_studio_templates")
      .select("*")
      .eq("company_id", sourceCi.company_id)
      .eq("template_id", sourceCi.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    const sourceStudio = studioRows?.[0];

    // Build grounded prompt
    const sectionsText = sourceStudio?.sections ? JSON.stringify(sourceStudio.sections).slice(0, 16000) : "";

    // Auto-detect modules if the caller didn't supply them.
    const allowed = new Set(ALL_MODULE_KEYS);
    let modules = (body.modules ?? []).filter((k) => allowed.has(k));
    if (modules.length === 0) {
      modules = await detectModules(sourceCi.name ?? "", sectionsText);
    }

    const moduleSlices = modules.map((k) => {
      const m = (XYREG_FEATURE_MAP as any)[k];
      return m ? `### ${m.label} (${m.path})\n` + (m.actions ?? []).map((a: any) =>
        `- ${a.label}:\n  ${(a.steps ?? []).map((s: string) => `• ${s}`).join("\n  ")}`,
      ).join("\n") : "";
    }).filter(Boolean).join("\n\n");

    const prompt =
      `You are generating a Work Instruction (WI) that translates an SOP into concrete, click-by-click steps inside the XyReg medical-device QMS application.\n\n` +
      `STRICT RULES:\n` +
      `- Use ONLY navigation paths and UI actions present in the FEATURE MAP below. Do not invent menus, screens, or button names that are not listed.\n` +
      `- Each step must be a single observable action ("Click X", "Enter Y", "Select Z").\n` +
      `- Refer to the SOP for *what* to do; refer to the feature map for *how* to do it in XyReg.\n` +
      `- When a step has a non-obvious constraint (immutable field, signature lock, irreversible action, role gate), attach a short "caution" string to that step. For helpful but non-critical tips, attach a "note" string instead.\n` +
      `- Use the top-level "cautions" array for system-wide warnings that don't belong to a single step (e.g. "Once Product Name is saved it cannot be changed without a CCR").\n` +
      `- Output ONLY valid JSON matching the requested shape — no prose around it, no markdown fences.\n\n` +
      `JSON SHAPE:\n` +
      `{ "title": string, "scope": string, "roles": string[], "steps": [{"step": number, "title": string, "detail": string, "note"?: string, "caution"?: string}], "acceptance": string[], "notes"?: string[], "cautions"?: string[] }\n\n` +
      (body.focus ? `SPECIFIC FOCUS: ${body.focus}\n\n` : "") +
      `SOURCE SOP TITLE: ${sourceCi.name}\n` +
      `SOURCE SOP CONTENT (JSON):\n${sectionsText}\n\n` +
      `XYREG FEATURE MAP:\n${moduleSlices}\n`;

    let raw = "";
    try {
      raw = await callGemini({
        prompt,
        temperature: 0.3,
        maxOutputTokens: 6000,
        jsonOutput: true,
      });
    } catch (e) {
      console.error("WI generation engine error", e);
      const status = e instanceof LovableAIError ? e.status : 502;
      const message = e instanceof Error ? e.message : "WI generation engine error";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let wi: WIPayload;
    try {
      wi = JSON.parse(stripFence(raw));
    } catch {
      return new Response(JSON.stringify({ error: "AI returned non-JSON output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute next WI number with the source's sub-prefix when present
    // e.g. SOP-DE-008 → WI-DE-NNN; otherwise WI-NNN.
    const subPrefixMatch = (sourceCi.document_number ?? "").match(/^SOP-([A-Z]{2,4})-/i);
    const subPrefix = subPrefixMatch ? subPrefixMatch[1].toUpperCase() : null;
    const numberPattern = subPrefix ? `WI-${subPrefix}-` : "WI-";

    const { data: existingWis } = await supabase
      .from("phase_assigned_document_template")
      .select("document_number")
      .eq("company_id", sourceCi.company_id)
      .ilike("document_number", `${numberPattern}%`);
    const usedNums = new Set<number>();
    (existingWis ?? []).forEach((r) => {
      const m = String(r.document_number ?? "").match(/(\d+)$/);
      if (m) usedNums.add(parseInt(m[1], 10));
    });
    let next = 1;
    while (usedNums.has(next)) next += 1;
    const newNumber = `${numberPattern}${String(next).padStart(3, "0")}`;

    // Build studio sections from WI payload.
    // The drawer expects each section's `content` to be an array of items
    // like [{ type: 'paragraph', content: '<p>HTML</p>' }].
    const para = (html: string) => ({ type: 'paragraph', content: html });
    const escape = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const stepHtml = (s: WIStep) => {
      const note = s.note ? `<div class="wi-note"><strong>Note:</strong> ${escape(s.note)}</div>` : '';
      const caution = s.caution ? `<div class="wi-caution"><strong>Caution:</strong> ${escape(s.caution)}</div>` : '';
      return `<li><strong>${escape(s.title)}</strong><br/>${escape(s.detail)}${note}${caution}</li>`;
    };
    const globalCautions = (wi.cautions ?? []).length > 0
      ? `<div class="wi-caution"><strong>Caution:</strong><ul>${(wi.cautions ?? []).map((c) => `<li>${escape(c)}</li>`).join('')}</ul></div>`
      : '';
    const globalNotes = (wi.notes ?? []).length > 0
      ? `<div class="wi-note"><strong>Note:</strong><ul>${(wi.notes ?? []).map((n) => `<li>${escape(n)}</li>`).join('')}</ul></div>`
      : '';
    const sections = [
      { id: 'scope', title: '1. Scope', content: [para(`<p>${escape(wi.scope ?? '')}</p>`)] },
      { id: 'roles', title: '2. Roles', content: [para(
        `<ul>${(wi.roles ?? []).map((r) => `<li>${escape(r)}</li>`).join('')}</ul>`,
      )] },
      { id: 'procedure', title: '3. Procedure', content: [para(
        `${globalCautions}${globalNotes}<ol>${(wi.steps ?? []).map(stepHtml).join('')}</ol>`,
      )] },
      { id: 'acceptance', title: '4. Acceptance Criteria', content: [para(
        `<ul>${(wi.acceptance ?? []).map((a) => `<li>${escape(a)}</li>`).join('')}</ul>`,
      )] },
      { id: 'reference', title: '5. Reference', content: [para(
        `<p>Derived from ${escape(sourceCi.document_number ?? sourceCi.name)}.</p>`,
      )] },
      { id: 'approval', title: '6. Approval & Change Control', content: [para(
        `<p>Version 1.0 — Authorised under <strong>CCR-PENDING</strong>. Subsequent revisions require a new Change Control Record (CCR) per SOP-006 Change Control. The authorising CCR number will be linked here once the CCR is approved.</p>`,
      )] },
      { id: 'authority', title: '7. Document Authority Notice', content: [para(
        `<p><em>The Master Record for this Work Instruction resides in Xyreg. Printed or exported copies are uncontrolled; if a copy diverges from the digital system, the Xyreg version is authoritative.</em></p>`,
      )] },
    ];

    const wiTitle = wi.title || `Work Instruction — ${sourceCi.name}`;

    const newCiPayload: Record<string, unknown> = {
      company_id: sourceCi.company_id,
      product_id: sourceCi.product_id,
      phase_id: sourceCi.phase_id,
      name: wiTitle,
      document_type: "WI",
      sub_section: sourceCi.sub_section,
      section_ids: sourceCi.section_ids,
      tags: sourceCi.tags,
      is_record: false,
      document_number: newNumber,
      status: "Draft",
      language: sourceCi.language ?? "EN",
      derived_from_ci_id: sourceCi.id,
      derivation_type: "work_instruction",
    };

    const { data: newCi, error: insertErr } = await supabase
      .from("phase_assigned_document_template")
      .insert(newCiPayload as any)
      .select()
      .single();

    if (insertErr || !newCi) {
      console.error("Insert WI CI failed", insertErr);
      return new Response(JSON.stringify({ error: "Could not create WI CI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studioInsert: Record<string, unknown> = {
      company_id: sourceCi.company_id,
      product_id: sourceCi.product_id,
      template_id: newCi.id,
      name: wiTitle,
      type: 'WI',
      sections,
      metadata: {
        derived_from_ci_id: sourceCi.id,
        derivation_type: "work_instruction",
        modules,
        modules_auto_detected: !body.modules || body.modules.length === 0,
        focus: body.focus ?? null,
      },
    };
    const { error: studioErr } = await supabase
      .from("document_studio_templates")
      .insert(studioInsert as any);
    if (studioErr) {
      console.error("[generate-work-instruction] studio insert failed", studioErr);
      return new Response(JSON.stringify({
        error: `WI CI created but content could not be saved: ${studioErr.message}`,
        newCiId: newCi.id,
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update parent's derived_work_instructions array
    const existing = (sourceCi.derived_work_instructions as string[] | null) ?? [];
    if (!existing.includes(newCi.id)) {
      await supabase
        .from("phase_assigned_document_template")
        .update({ derived_work_instructions: [...existing, newCi.id] } as any)
        .eq("id", sourceCi.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        newCiId: newCi.id,
        newDocumentNumber: newNumber,
        newName: wiTitle,
        modules,
        wi,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-work-instruction fatal", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});