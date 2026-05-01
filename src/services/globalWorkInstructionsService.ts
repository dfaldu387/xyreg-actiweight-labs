/**
 * Global Work Instructions service.
 *
 * Foundational (Tier-A) SOPs are identical across all companies, so their
 * derived Work Instructions are also identical and stored once in
 * `global_work_instructions`. Per-company materialization on first open
 * creates a per-company CI + Studio draft that points at the global WI,
 * so the existing DocumentDraftDrawer can edit / view it like any other
 * document. Re-opening surfaces the same materialized CI.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface GlobalWI {
  id: string;
  sop_template_key: string;
  wi_number: string;
  title: string;
  scope: string | null;
  roles: string[] | null;
  modules: string[];
  sections: unknown;
  focus: string | null;
  version: number;
}

/**
 * List the global WIs derived from a foundational SOP key (e.g. "SOP-001").
 */
export async function listGlobalWIsForSop(
  sopTemplateKey: string,
): Promise<GlobalWI[]> {
  const { data, error } = await supabase
    .from('global_work_instructions' as never)
    .select('*')
    .eq('sop_template_key', sopTemplateKey)
    .order('wi_number', { ascending: true });
  if (error) {
    console.error('[globalWI] list failed', error);
    return [];
  }
  return (data ?? []) as unknown as GlobalWI[];
}

/**
 * Resolve (or create) the per-company CI that materializes a global WI.
 * Returns the CI id ready for the DocumentDraftDrawer to open.
 */
export async function materializeGlobalWIForCompany(opts: {
  globalWiId: string;
  companyId: string;
  phaseId: string;
}): Promise<string | null> {
  const { globalWiId, companyId, phaseId } = opts;

  // 1. If already materialized, reuse.
  const { data: existingMat } = await supabase
    .from('global_wi_company_materializations' as never)
    .select('ci_id')
    .eq('global_wi_id', globalWiId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (existingMat && (existingMat as { ci_id?: string }).ci_id) {
    return (existingMat as { ci_id: string }).ci_id;
  }

  // 2. Load the global WI.
  const { data: wi, error: wiErr } = await supabase
    .from('global_work_instructions' as never)
    .select('*')
    .eq('id', globalWiId)
    .maybeSingle();
  if (wiErr || !wi) {
    console.error('[globalWI] failed to load', wiErr);
    return null;
  }
  const gwi = wi as unknown as GlobalWI;

  // 3. Per-company number == global number (WI parent + child suffix,
  //    e.g. "WI-QA-002-1"). The child index is scoped to its parent SOP
  //    family so collisions are impossible. If a row with that number
  //    already exists for this company (e.g. from an earlier materialization
  //    that didn't record into the materializations table), reuse it.
  const newNumber = gwi.wi_number;
  const { data: existingByNumber } = await supabase
    .from('phase_assigned_document_template')
    .select('id')
    .eq('company_id', companyId)
    .eq('document_number', newNumber)
    .maybeSingle();
  if (existingByNumber?.id) {
    // Backfill the materialization record so we don't keep re-checking.
    await supabase
      .from('global_wi_company_materializations' as never)
      .insert({
        global_wi_id: gwi.id,
        company_id: companyId,
        ci_id: existingByNumber.id,
      } as never);
    return existingByNumber.id;
  }

  // 4. Create CI + Studio draft pointing at the global WI.
  const { data: ci, error: ciErr } = await supabase
    .from('phase_assigned_document_template')
    .insert({
      name: gwi.title,
      company_id: companyId,
      phase_id: phaseId,
      document_type: 'WI',
      document_number: newNumber,
      document_scope: 'company_document',
      status: 'Draft',
      version: '1.0',
      is_record: false,
      derivation_type: 'work_instruction',
      description: `Materialized from global Work Instruction ${gwi.wi_number} (foundational ${gwi.sop_template_key}).`,
    } as never)
    .select('id')
    .single();
  if (ciErr || !ci) {
    console.error('[globalWI] CI insert failed', ciErr);
    return null;
  }

  const { error: studioErr } = await supabase
    .from('document_studio_templates')
    .insert({
      template_id: ci.id,
      company_id: companyId,
      name: gwi.title,
      type: 'WI',
      sections: gwi.sections as unknown as Json,
      metadata: {
        derived_from_global_wi_id: gwi.id,
        derivation_type: 'work_instruction',
        modules: gwi.modules,
        focus: gwi.focus,
        sop_template_key: gwi.sop_template_key,
        materializedAt: new Date().toISOString(),
      } as unknown as Json,
    });
  if (studioErr) {
    console.error('[globalWI] studio insert failed', studioErr);
    return ci.id;
  }

  // 5. Record materialization so we don't duplicate next time.
  await supabase
    .from('global_wi_company_materializations' as never)
    .insert({
      global_wi_id: gwi.id,
      company_id: companyId,
      ci_id: ci.id,
    } as never);

  return ci.id;
}