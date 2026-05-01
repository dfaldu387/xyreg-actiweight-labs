/**
 * Eager per-company materialization of all global Work Instructions.
 *
 * Companion to the lazy `materializeGlobalWIForCompany` (which runs on
 * first click inside an SOP's Configure panel). This service walks the
 * full `global_work_instructions` catalog and materializes every entry
 * for the given company so they appear in the document list immediately
 * (e.g. `WI-QA-001-1`, `WI-QA-001-2`, …) — no need to dig into a drawer.
 *
 * Idempotent: relies on `global_wi_company_materializations` to skip
 * anything already materialized for this company.
 */
import { supabase } from '@/integrations/supabase/client';
import { materializeGlobalWIForCompany } from './globalWorkInstructionsService';

export interface EagerWiSeedResult {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Resolve the company's primary phase id (used to anchor materialized WIs).
 * Mirrors the resolver inside `sopAutoSeedService` so WIs land in the same
 * phase as their parent SOPs.
 */
async function resolvePhaseId(companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from('company_phases')
    .select('id')
    .eq('company_id', companyId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function eagerSeedCompanyWorkInstructions(opts: {
  companyId: string;
  /** Optional override; otherwise the company's first phase is used. */
  phaseId?: string | null;
  /** Progress callback fired after each WI is processed. */
  onProgress?: (done: number, total: number, currentTitle: string) => void;
}): Promise<EagerWiSeedResult> {
  const result: EagerWiSeedResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const phaseId = opts.phaseId ?? (await resolvePhaseId(opts.companyId));
  if (!phaseId) {
    result.errors.push('No company phase found to anchor Work Instructions');
    return result;
  }

  // 1. Load full catalog.
  const { data: catalog, error: catErr } = await supabase
    .from('global_work_instructions' as never)
    .select('id, title, wi_number')
    .order('sop_template_key', { ascending: true })
    .order('wi_number', { ascending: true });
  if (catErr || !catalog) {
    result.errors.push(`Failed to load global WI catalog: ${catErr?.message ?? 'unknown'}`);
    return result;
  }

  // 2. Existing materializations for this company.
  const { data: existing } = await supabase
    .from('global_wi_company_materializations' as never)
    .select('global_wi_id')
    .eq('company_id', opts.companyId);
  const alreadyDone = new Set<string>(
    ((existing ?? []) as { global_wi_id: string }[]).map((r) => r.global_wi_id),
  );

  const total = catalog.length;
  for (let i = 0; i < total; i++) {
    const wi = catalog[i] as { id: string; title: string; wi_number: string };
    opts.onProgress?.(i, total, wi.title);
    if (alreadyDone.has(wi.id)) {
      result.skipped += 1;
      continue;
    }
    try {
      const ciId = await materializeGlobalWIForCompany({
        globalWiId: wi.id,
        companyId: opts.companyId,
        phaseId,
      });
      if (ciId) result.created += 1;
      else {
        result.failed += 1;
        result.errors.push(`Failed to materialize ${wi.wi_number}`);
      }
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${wi.wi_number}: ${(err as Error).message}`);
    }
  }
  opts.onProgress?.(total, total, '');
  return result;
}