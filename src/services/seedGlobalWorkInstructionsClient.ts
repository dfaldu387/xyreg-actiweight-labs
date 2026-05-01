/**
 * Client wrapper for the `seed-global-work-instructions` edge function.
 * Reads canonical foundational SOP content from the in-app SSOT
 * (`SOP_FULL_CONTENT`) and posts it to the edge function so the AI can
 * generate the WI catalog server-side.
 */
import { supabase } from '@/integrations/supabase/client';
import { TIER_A_AUTO_SEED, SOP_FUNCTIONAL_SUBPREFIX } from '@/constants/sopAutoSeedTiers';
import { SOP_FULL_CONTENT, sopContentToSections } from '@/data/sopFullContent';
import { GLOBAL_WI_CATALOG_SPEC } from '@/constants/globalWiCatalogSpec';

export interface SeedGlobalWIResult {
  success: boolean;
  summary?: Record<string, { inserted: number; skipped: number; failed: number; errors: string[] }>;
  error?: string;
}

export async function seedGlobalWorkInstructions(opts: {
  /** When provided, only these SOP keys are seeded. Defaults to all Tier-A. */
  sopKeys?: readonly string[];
  /** If true, deletes existing global WIs for each key before regenerating. */
  replace?: boolean;
  /** Optional progress callback: (completed, total, currentKey). */
  onProgress?: (completed: number, total: number, currentKey: string) => void;
}): Promise<SeedGlobalWIResult> {
  const keys = opts.sopKeys ?? TIER_A_AUTO_SEED.map((s) => s.sop);
  const sops = keys
    .map((key) => {
      const content = SOP_FULL_CONTENT[key];
      if (!content) return null;
      // Curated WI list for this SOP. SOPs absent from the spec map are
      // skipped (e.g. Quality Manual = 0 WIs by design).
      const focuses = (GLOBAL_WI_CATALOG_SPEC[key] ?? []).map((e) => ({
        slug: e.slug,
        focus: e.focus,
        roles: e.roles,
      }));
      if (focuses.length === 0) return null;
      const subPrefix = SOP_FUNCTIONAL_SUBPREFIX[key] ?? null;
      // Build parent SOP number, e.g. "SOP-QA-002". Falls back to the raw
      // key (e.g. "SOP-001") if no functional sub-prefix is mapped.
      // WI numbers carry their parent SOP family number so they sort and
      // match against the SOP at a glance. Format:
      //   WI-{subPrefix}-{parentSopNum}-{childIdx}
      // e.g. parent SOP-QA-001 → WI-QA-001-1, WI-QA-001-2, ...
      const sopNumeric = key.match(/(\d+)/)?.[1] ?? '';
      const parentNumber = subPrefix && sopNumeric
        ? `WI-${subPrefix}-${sopNumeric.padStart(3, '0')}`
        : `WI-${sopNumeric.padStart(3, '0') || key}`;
      return {
        key,
        title: content.title,
        sections: sopContentToSections(content),
        subPrefix,
        parentNumber,
        focuses,
      };
    })
    .filter(Boolean) as Array<{
      key: string;
      title: string;
      sections: unknown;
      subPrefix: string | null;
      parentNumber: string;
      focuses: Array<{ slug: string; focus: string; roles: string[] }>;
    }>;

  // Process ONE SOP per edge invocation to stay well under the 150s
  // edge-function idle timeout. Each SOP triggers (1 + N) Gemini calls
  // where N is the curated focus count; comfortably fits one request.
  const mergedSummary: NonNullable<SeedGlobalWIResult['summary']> = {};
  for (let i = 0; i < sops.length; i++) {
    const sop = sops[i];
    opts.onProgress?.(i, sops.length, sop.key);
    const { data, error } = await supabase.functions.invoke(
      'seed-global-work-instructions',
      { body: { sops: [sop], replace: !!opts.replace } },
    );
    if (error) {
      mergedSummary[sop.key] = {
        inserted: 0,
        skipped: 0,
        failed: 1,
        errors: [error.message],
      };
      continue;
    }
    const result = data as SeedGlobalWIResult;
    if (result?.summary) Object.assign(mergedSummary, result.summary);
  }
  opts.onProgress?.(sops.length, sops.length, '');
  return { success: true, summary: mergedSummary };
}