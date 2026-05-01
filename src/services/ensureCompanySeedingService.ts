/**
 * Idempotent self-heal seeding for a company.
 *
 * Customers should never see a "Generate" / "Create" button on the
 * Documents page. This service is fired (silently, in the background)
 * on Documents page mount and after registration to top-up anything
 * missing:
 *
 *  1. Tier-A Foundation SOPs   — `seedTierASopsForCompany`
 *  2. Tier-B Pathway SOPs       — `seedAllTierBSopsForCompany`
 *  3. Device-specific templates — TODO when content/service exists
 *  4. Per-company WI drafts     — `eagerSeedCompanyWorkInstructions`
 *
 * All four underlying calls are themselves idempotent (skip-if-present),
 * so calling this on every mount is cheap when nothing is missing.
 *
 * No toasts. No spinners. The Templates list refetches via React Query
 * cache invalidation when something is actually inserted.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  seedTierASopsForCompany,
  seedAllTierBSopsForCompany,
  countTierASopsPresent,
  countTierBSopsPresent,
} from '@/services/sopAutoSeedService';
import { eagerSeedCompanyWorkInstructions } from '@/services/eagerSeedCompanyWIsClient';
import { TIER_A_AUTO_SEED, TIER_B_CONDITIONAL } from '@/constants/sopAutoSeedTiers';

export interface EnsureSeedingResult {
  tierAInserted: number;
  tierBInserted: number;
  wiCreated: number;
  errors: string[];
}

/**
 * Top-up any missing seeded artifacts for the given company. Safe to call
 * on every Documents-page mount — when nothing is missing it makes a few
 * cheap COUNT queries and exits.
 */
export async function ensureCompanySeedingComplete(
  companyId: string,
  companyName: string,
): Promise<EnsureSeedingResult> {
  const result: EnsureSeedingResult = {
    tierAInserted: 0,
    tierBInserted: 0,
    wiCreated: 0,
    errors: [],
  };
  if (!companyId || !companyName) return result;

  // 1. Tier-A Foundation SOPs.
  try {
    const presentA = await countTierASopsPresent(companyId);
    if (presentA < TIER_A_AUTO_SEED.length) {
      const r = await seedTierASopsForCompany(companyId, companyName);
      result.tierAInserted = r.inserted;
      if (r.failed > 0) result.errors.push(`${r.failed} Tier-A SOP(s) failed`);
    }
  } catch (err) {
    result.errors.push(`Tier-A top-up: ${(err as Error).message}`);
  }

  // 2. Tier-B Pathway-conditional SOPs (currently all-on; pathway gating
  //    can be wired in later by passing a sopKeys subset).
  try {
    const presentB = await countTierBSopsPresent(companyId);
    if (presentB < TIER_B_CONDITIONAL.length) {
      const r = await seedAllTierBSopsForCompany(companyId, companyName);
      result.tierBInserted = r.inserted;
      if (r.failed > 0) result.errors.push(`${r.failed} Tier-B SOP(s) failed`);
    }
  } catch (err) {
    result.errors.push(`Tier-B top-up: ${(err as Error).message}`);
  }

  // 3. Device-specific templates — extension point. No service exists yet;
  //    when one is added, call it here so it auto-flows on every mount.

  // 4. Per-company WI drafts. Only run if the global catalog has rows
  //    (otherwise there is nothing to materialize).
  try {
    const { count } = await supabase
      .from('global_work_instructions' as never)
      .select('id', { count: 'exact', head: true });
    if ((count ?? 0) > 0) {
      const { count: matCount } = await supabase
        .from('global_wi_company_materializations' as never)
        .select('global_wi_id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if ((matCount ?? 0) < (count ?? 0)) {
        const r = await eagerSeedCompanyWorkInstructions({ companyId });
        result.wiCreated = r.created;
        if (r.failed > 0) result.errors.push(`${r.failed} WI(s) failed to materialize`);
      }
    }
  } catch (err) {
    result.errors.push(`WI top-up: ${(err as Error).message}`);
  }

  if (result.errors.length > 0) {
    console.warn('[ensureCompanySeedingComplete] partial errors', result.errors);
  }
  return result;
}