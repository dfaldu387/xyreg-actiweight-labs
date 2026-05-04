import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callGemini, LovableAIError } from "../_shared/lovable-ai.ts";
import { XYREG_FEATURE_MAP, ALL_MODULE_KEYS } from "../_shared/xyregFeatureMap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Seed the global Work Instruction catalog for foundational (Tier-A) SOPs.
 *
 * Body shape:
 * {
 *   sops: [
 *     { key: "SOP-001", title: "Quality Management System", sections: <jsonb>, subPrefix: "QA" },
 *     ...
 *   ],
 *   wisPerSop?: number  // default 3
 *   replace?: boolean   // if true, deletes existing WIs for each key first
 * }
 *
 * For each SOP it asks the AI to:
 *   1. Detect which XyReg modules it touches.
 *   2. Propose `wisPerSop` distinct task-focused WI titles + scopes.
 *   3. Generate a click-by-click WI for each, grounded in XYREG_FEATURE_MAP.
 *
 * Idempotent unless `replace=true`: skips SOPs that already have any rows.
 */

interface SopSeed {
  key: string;
  title: string;
  sections?: unknown;
  subPrefix?: string | null;
  /** Parent SOP document number, e.g. "SOP-QA-002". When provided, WIs are
   *  numbered as `${parentNumber}-${childIndex}` (FDA/ISO convention). */
  parentNumber?: string | null;
  /** Curated focuses (v2). When present, AI focus-proposal is skipped. */
  focuses?: Array<{ slug: string; focus: string; roles?: string[] }>;
}

interface Body {
  sops: SopSeed[];
  replace?: boolean;
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

async function detectModules(title: string, sectionsText: string): Promise<string[]> {
  const moduleCatalog = ALL_MODULE_KEYS.map(
    (k) => `- ${k}: ${XYREG_FEATURE_MAP[k].label} (${XYREG_FEATURE_MAP[k].path})`,
  ).join("\n");
  const prompt =
    `Classify which XyReg modules this SOP touches. Return ONLY a JSON array of module keys.\n\n` +
    `Module keys:\n${moduleCatalog}\n\n` +
    `SOP TITLE: ${title}\n` +
    `SOP CONTENT:\n${sectionsText.slice(0, 12000)}\n`;
  try {
    const raw = await callGemini({ prompt, temperature: 0.1, maxOutputTokens: 200, jsonOutput: true });
    const parsed = JSON.parse(stripFence(raw));
    // Build a case-insensitive lookup so AI returning "missionControl" or
    // "MissionControl" still maps to the canonical lowercase key.
    const allowedByLower = new Map<string, string>();
    ALL_MODULE_KEYS.forEach((k) => allowedByLower.set(k.toLowerCase(), k));
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.modules) ? parsed.modules : [];
    const filtered = arr
      .filter((k: unknown): k is string => typeof k === "string")
      .map((k: string) => allowedByLower.get(k.toLowerCase()))
      .filter((k): k is string => !!k);
    if (filtered.length > 0) return filtered;
  } catch (e) {
    console.warn("module detection failed", e);
  }
  return ["documents"];
}

async function proposeFocuses(title: string, sectionsText: string, n: number): Promise<string[]> {
  const prompt =
    `Propose ${n} distinct, concrete task-focused Work Instruction titles that an end-user would actually need when executing this SOP inside the XyReg QMS app. Each focus must be a single observable workflow ("Approving a CAPA after effectiveness check", "Releasing a controlled document"). Return ONLY a JSON array of strings.\n\n` +
    `SOP TITLE: ${title}\nSOP CONTENT:\n${sectionsText.slice(0, 12000)}\n`;
  try {
    const raw = await callGemini({ prompt, temperature: 0.4, maxOutputTokens: 400, jsonOutput: true });
    const parsed = JSON.parse(stripFence(raw));
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.focuses) ? parsed.focuses : [];
    const filtered = arr.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0);
    if (filtered.length > 0) return filtered.slice(0, n);
  } catch (e) {
    console.warn("focus proposal failed", e);
  }
  return [`Executing ${title}`];
}

/** Strip any leaked WI-XX-NNN prefix from a title returned by the AI. */
function sanitizeWITitle(t: string | undefined, fallback: string): string {
  const cleaned = String(t ?? "")
    .replace(/^\s*WI[-_]?[A-Z0-9-]*\s*[:\-–—]?\s*/i, "")
    .trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

async function generateWI(
  title: string,
  sectionsText: string,
  modules: string[],
  focus: string,
): Promise<WIPayload | null> {
  const moduleSlices = modules.map((k) => {
    const m = XYREG_FEATURE_MAP[k];
    return m
      ? `### ${m.label} (${m.path})\n` +
          (m.actions ?? [])
            .map((a) => `- ${a.label}:\n  ${(a.steps ?? []).map((s) => `• ${s}`).join("\n  ")}`)
            .join("\n")
      : "";
  }).filter(Boolean).join("\n\n");

  const prompt =
    `You are generating a Work Instruction (WI) translating an SOP into concrete, click-by-click steps inside the XyReg medical-device QMS application.\n\n` +
    `STRICT RULES:\n` +
    `- Use ONLY navigation paths and UI actions present in the FEATURE MAP below. Do not invent menus.\n` +
    `- Each step must be a single observable action.\n` +
    `- The "title" field MUST be a plain task name. NEVER include a WI number, ID, or prefix like "WI-QA-001:" in the title.\n` +
    `- When a step has a non-obvious constraint (immutable field, signature lock, irreversible action, role gate), attach a short "caution" string to that step. For helpful but non-critical tips, attach a "note" string instead.\n` +
    `- Use the top-level "cautions" array for system-wide warnings that don't belong to a single step (e.g. "Once Product Name is saved it cannot be changed without a CCR").\n` +
    `- Output ONLY valid JSON matching the requested shape.\n\n` +
    `JSON SHAPE:\n` +
    `{ "title": string, "scope": string, "roles": string[], "steps": [{"step": number, "title": string, "detail": string, "note"?: string, "caution"?: string}], "acceptance": string[], "notes"?: string[], "cautions"?: string[] }\n\n` +
    `SPECIFIC FOCUS: ${focus}\n\n` +
    `SOURCE SOP TITLE: ${title}\n` +
    `SOURCE SOP CONTENT:\n${sectionsText.slice(0, 14000)}\n\n` +
    `XYREG FEATURE MAP:\n${moduleSlices}\n`;

  try {
    const raw = await callGemini({ prompt, temperature: 0.3, maxOutputTokens: 6000, jsonOutput: true });
    return JSON.parse(stripFence(raw)) as WIPayload;
  } catch (e) {
    console.error("WI generation failed for focus", focus, e);
    return null;
  }
}

function sectionsFromWI(wi: WIPayload, sourceTitle: string, sourceSopNumber: string | null) {
  const escape = (s: string) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const para = (html: string) => ({ type: "paragraph", content: html });
  const stepHtml = (s: WIStep) => {
    const note = s.note ? `<div class="wi-note"><strong>Note:</strong> ${escape(s.note)}</div>` : "";
    const caution = s.caution ? `<div class="wi-caution"><strong>Caution:</strong> ${escape(s.caution)}</div>` : "";
    return `<li><strong>${escape(s.title)}</strong><br/>${escape(s.detail)}${note}${caution}</li>`;
  };
  const globalCautions = (wi.cautions ?? []).length > 0
    ? `<div class="wi-caution"><strong>Caution:</strong><ul>${(wi.cautions ?? []).map((c) => `<li>${escape(c)}</li>`).join("")}</ul></div>`
    : "";
  const globalNotes = (wi.notes ?? []).length > 0
    ? `<div class="wi-note"><strong>Note:</strong><ul>${(wi.notes ?? []).map((n) => `<li>${escape(n)}</li>`).join("")}</ul></div>`
    : "";
  return [
    { id: "scope", title: "1. Scope", content: [para(`<p>${escape(wi.scope ?? "")}</p>`)] },
    { id: "roles", title: "2. Roles", content: [para(
      `<ul>${(wi.roles ?? []).map((r) => `<li>${escape(r)}</li>`).join("")}</ul>`,
    )] },
    { id: "procedure", title: "3. Procedure", content: [para(
      `${globalCautions}${globalNotes}<ol>${(wi.steps ?? []).map(stepHtml).join("")}</ol>`,
    )] },
    { id: "acceptance", title: "4. Acceptance Criteria", content: [para(
      `<ul>${(wi.acceptance ?? []).map((a) => `<li>${escape(a)}</li>`).join("")}</ul>`,
    )] },
    { id: "reference", title: "5. Reference", content: [para(
      sourceSopNumber
        ? `<p>Derived from foundational SOP: ${escape(sourceSopNumber)} ${escape(sourceTitle)}.</p>`
        : `<p>Derived from foundational SOP: ${escape(sourceTitle)}.</p>`,
    )] },
    { id: "approval", title: "6. Approval & Change Control", content: [para(
      `<p>Version 1.0 — Authorised under <strong>CCR-PENDING</strong>. Subsequent revisions require a new Change Control Record (CCR) per SOP-006 Change Control. The authorising CCR number will be linked here once the CCR is approved.</p>`,
    )] },
    { id: "authority", title: "7. Document Authority Notice", content: [para(
      `<p><em>The Master Record for this Work Instruction resides in Xyreg. Printed or exported copies are uncontrolled; if a copy diverges from the digital system, the Xyreg version is authoritative.</em></p>`,
    )] },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json()) as Body;
    const sops = body.sops ?? [];
    const replace = !!body.replace;

    if (sops.length === 0) {
      return new Response(JSON.stringify({ error: "sops array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary: Record<string, { inserted: number; skipped: number; failed: number; errors: string[] }> = {};

    for (const sop of sops) {
      summary[sop.key] = { inserted: 0, skipped: 0, failed: 0, errors: [] };

      // Idempotency: if rows already exist for this key, skip unless replace=true.
      const { data: existingRows } = await supabase
        .from("global_work_instructions")
        .select("id")
        .eq("sop_template_key", sop.key);

      if (existingRows && existingRows.length > 0) {
        if (!replace) {
          summary[sop.key].skipped = existingRows.length;
          continue;
        }
        await supabase.from("global_work_instructions").delete().eq("sop_template_key", sop.key);
      }

      const sectionsText = sop.sections ? JSON.stringify(sop.sections) : "";

      // 1. Detect modules
      const modules = await detectModules(sop.title, sectionsText);

      // 2. Resolve focuses. Prefer curated (v2) focuses when supplied;
      //    fall back to AI-proposed focuses for legacy callers.
      const curated = Array.isArray(sop.focuses) ? sop.focuses : [];
      const focuses: Array<{ slug?: string; focus: string; roles?: string[] }> =
        curated.length > 0
          ? curated
          : (await proposeFocuses(sop.title, sectionsText, 3)).map((f) => ({ focus: f }));

      // 3. Generate each WI and persist
      const subPrefix = sop.subPrefix ? sop.subPrefix.toUpperCase() : null;
      // Derive WI parent number (e.g. "WI-QA-002") that carries the parent
      // SOP family number. Prefer caller-supplied value; otherwise build
      // from key + subPrefix.
      const sopNumeric = sop.key.match(/(\d+)/)?.[1] ?? "";
      const parentNumber = sop.parentNumber
        ? sop.parentNumber.toUpperCase()
        : subPrefix && sopNumeric
          ? `WI-${subPrefix}-${sopNumeric.padStart(3, "0")}`
          : `WI-${sopNumeric.padStart(3, "0") || sop.key}`;

      for (let i = 0; i < focuses.length; i++) {
        const entry = focuses[i];
        const focusText = entry.focus;
        const wi = await generateWI(sop.title, sectionsText, modules, focusText);
        if (!wi) {
          summary[sop.key].failed++;
          summary[sop.key].errors.push(`focus "${focusText}": AI returned no WI`);
          continue;
        }

        // Child suffix: WI-QA-002-1, WI-QA-002-2, ...
        const wiNumber = `${parentNumber}-${i + 1}`;
        // Derive the parent SOP number from the WI parent number so the
        // Reference section becomes a clickable chip in the editor.
        const sourceSopNumber = parentNumber.startsWith("WI-")
          ? parentNumber.replace(/^WI-/, "SOP-")
          : null;
        const sections = sectionsFromWI(wi, sop.title, sourceSopNumber);
        const cleanedTitle = sanitizeWITitle(wi.title, `Work Instruction — ${focusText}`);
        // Merge curated roles with AI-suggested roles, dedupe.
        const mergedRoles = Array.from(
          new Set([...(entry.roles ?? []), ...((wi.roles ?? []) as string[])]),
        );

        const { error: insertErr } = await supabase.from("global_work_instructions").insert({
          sop_template_key: sop.key,
          wi_number: wiNumber,
          title: cleanedTitle,
          scope: wi.scope ?? null,
          roles: mergedRoles,
          modules,
          sections: sections as unknown as Record<string, unknown>,
          focus: focusText,
          version: 1,
        } as Record<string, unknown>);

        if (insertErr) {
          summary[sop.key].failed++;
          summary[sop.key].errors.push(`focus "${focusText}": ${insertErr.message}`);
        } else {
          summary[sop.key].inserted++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-global-work-instructions fatal", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});