import { supabase } from '@/integrations/supabase/client';
import { getGroupForSOP } from '@/constants/trainingGroups';
import { reissueTrainingOnVersionUpdate } from '@/services/trainingAutomationService';

/**
 * Sync approved company SOPs and Work Instructions into training_modules.
 * - One module per source document (idempotent via unique index on company_id+source_document_id).
 * - Updates source_version when the SOP version changes.
 * - Defaults `requires_quiz=true` for Foundation-tier SOPs (Tier A) and computes
 *   a sensible `minimum_read_seconds` from document word count (200 wpm).
 */
export async function syncTrainingModulesFromApprovedSOPs(companyId: string): Promise<{
  created: number;
  updated: number;
  total: number;
}> {
  // 1. Fetch all SOP and WI documents for this company that are approved/effective
  const { data: sops, error } = await supabase
    .from('documents')
    .select('id, name, description, version, status, brief_summary')
    .eq('company_id', companyId)
    .or('name.ilike.SOP-%,name.ilike.WI-%')
    .in('status', ['Approved', 'Effective', 'Released', 'In Review']);

  if (error) throw error;
  if (!sops || sops.length === 0) return { created: 0, updated: 0, total: 0 };

  // 1b. Foundation-tier SOP keys → require quiz by default
  const foundationKeys = new Set<string>();
  try {
    const { data: cat } = await supabase
      .from('fpd_sop_catalog' as never)
      .select('sop_key, tier');
    (cat as any[] | null)?.forEach((c) => {
      if (c.tier === 'foundation') foundationKeys.add(String(c.sop_key).toUpperCase());
    });
  } catch {
    // catalog optional
  }

  // 2. Existing auto-linked modules
  const { data: existing } = await supabase
    .from('training_modules')
    .select('id, source_document_id, source_version, name')
    .eq('company_id', companyId)
    .not('source_document_id', 'is', null);

  const byDoc = new Map((existing ?? []).map((m: any) => [m.source_document_id, m]));

  const wordsToSeconds = (text: string) => {
    const words = (text || '').split(/\s+/).filter(Boolean).length;
    const secs = Math.round((words / 200) * 60);
    return Math.min(600, Math.max(60, secs || 180));
  };

  const isFoundationSop = (name: string) => {
    // Match leading "SOP-XX" or "SOP-AAA-NNN" against catalog keys
    const key = name.match(/^SOP-[A-Z]+-?\d+/i)?.[0]?.toUpperCase();
    return key ? foundationKeys.has(key) : false;
  };

  let created = 0;
  let updated = 0;
  let reissued = 0;

  for (const sop of sops) {
    const current = byDoc.get(sop.id);
    const requiresQuiz = isFoundationSop(sop.name);
    const text = `${sop.brief_summary ?? ''}\n${sop.description ?? ''}`;
    const minRead = wordsToSeconds(text);
    if (!current) {
      const { error: insErr } = await supabase.from('training_modules').insert({
        company_id: companyId,
        name: sop.name,
        description: sop.brief_summary || sop.description || null,
        type: sop.name.startsWith('WI-') ? 'sop' : 'sop',
        delivery_method: 'self_paced',
        requires_signature: true,
        version: sop.version || '1.0',
        is_active: true,
        group_name: getGroupForSOP(sop.name),
        source_document_id: sop.id,
        source_version: sop.version || '1.0',
        auto_generated: true,
        pass_threshold: 80,
        requires_quiz: requiresQuiz,
        minimum_read_seconds: minRead,
        max_attempts: 3,
      } as any);
      if (!insErr) created++;
    } else if ((sop.version || '1.0') !== current.source_version) {
      const { error: updErr } = await supabase
        .from('training_modules')
        .update({
          source_version: sop.version || '1.0',
          version: sop.version || '1.0',
          name: sop.name,
          description: sop.brief_summary || sop.description || null,
          minimum_read_seconds: minRead,
        } as any)
        .eq('id', current.id);
      if (!updErr) {
        updated++;
        // Expire prior completions and re-issue training records for this module
        try {
          // Mark any non-completed records as expired so the phase ring flips red
          await supabase
            .from('training_records')
            .update({ phase: 'expired', status: 'expired' } as any)
            .eq('training_module_id', current.id)
            .eq('company_id', companyId)
            .eq('status', 'completed');
          const res = await reissueTrainingOnVersionUpdate(current.id, sop.version || '1.0', companyId, 30);
          reissued += res.recordsReissued;
        } catch (e) {
          console.error('Failed to expire/reissue on version bump', e);
        }
      }
    }
  }

  return { created, updated, total: sops.length, reissued } as any;
}