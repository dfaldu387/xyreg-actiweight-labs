/**
 * SOP Auto-Seed Service
 *
 * Provisions Tier A (universal boilerplate) SOPs as Document CIs and
 * Document Studio drafts at company creation time. Tier B (pathway-
 * conditional) SOPs can be batch-seeded later via the same mechanism.
 *
 * Idempotent: skips any SOP whose CI already exists for the company
 * (matched by name).
 *
 * Design notes:
 *  - CI-first save pattern (see `mem://architecture/integration/save-to-ci-documentation-pattern`):
 *    the row in `phase_assigned_document_template` is the CI; the row in
 *    `document_studio_templates` is the editable draft, linked by
 *    `template_id` (CI UUID).
 *  - `phase_id` references `company_phases.id`. The first company phase
 *    created by `CompanyInitializationService` is used as the anchor for
 *    all company-scope SOPs (they are not product-specific).
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  TIER_A_AUTO_SEED,
  TIER_B_CONDITIONAL,
  type TierBSop,
} from '@/constants/sopAutoSeedTiers';
import { SOP_FULL_CONTENT, sopContentToSections } from '@/data/sopFullContent';

export interface SopSeedResult {
  inserted: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const COMPANY_NAME_PLACEHOLDER = /\[Company Name\]/g;

/**
 * Resolve a phase_id to anchor company-scope SOP CIs. Uses the first
 * company_phase for the company. Returns null if none exists.
 */
async function resolveCompanyPhaseId(companyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_phases')
    .select('id')
    .eq('company_id', companyId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[sopAutoSeed] Failed to resolve company phase:', error);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Substitute company-specific placeholders in SOP section content.
 */
function personalizeSections(
  sections: ReturnType<typeof sopContentToSections>,
  companyName: string,
) {
  return sections.map((section) => ({
    ...section,
    content: section.content.map((block) => ({
      ...block,
      content:
        typeof block.content === 'string'
          ? block.content.replace(COMPANY_NAME_PLACEHOLDER, companyName)
          : block.content,
    })),
  }));
}

/**
 * Core seeder. Iterates the given SOP keys, creates a CI + Studio draft
 * for each one that doesn't already exist for the company.
 */
async function seedSopsForCompany(
  companyId: string,
  companyName: string,
  sopKeys: readonly string[],
): Promise<SopSeedResult> {
  const result: SopSeedResult = { inserted: 0, skipped: 0, failed: 0, errors: [] };

  if (!companyId || sopKeys.length === 0) return result;

  // Resolve anchor phase once
  const phaseId = await resolveCompanyPhaseId(companyId);
  if (!phaseId) {
    result.errors.push(
      'No company phase found — initialize company phases before seeding SOPs.',
    );
    result.failed = sopKeys.length;
    return result;
  }

  // Pre-fetch existing SOP CI names to avoid duplicates
  const { data: existing } = await supabase
    .from('phase_assigned_document_template')
    .select('name')
    .eq('company_id', companyId)
    .ilike('name', 'SOP-%');

  const existingTitles = new Set(
    (existing ?? []).map((r) => normalizeTitle(r.name ?? '')),
  );

  for (const sopKey of sopKeys) {
    const content = SOP_FULL_CONTENT[sopKey];
    if (!content) {
      result.failed++;
      result.errors.push(`${sopKey}: content definition missing`);
      continue;
    }

    const fullName = `${content.sopNumber} ${content.title}`;
    if (existingTitles.has(normalizeTitle(fullName))) {
      result.skipped++;
      continue;
    }

    try {
      // 1. Create the CI
      const { data: ci, error: ciError } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          name: fullName,
          company_id: companyId,
          phase_id: phaseId,
          document_type: 'SOP',
          document_scope: 'company_document',
          status: 'Draft',
          version: '1.0',
          is_record: false,
          description: `${content.title} — auto-seeded from Xyreg SOP library at company creation.`,
        })
        .select('id')
        .single();

      if (ciError || !ci) {
        result.failed++;
        result.errors.push(`${sopKey}: CI insert failed — ${ciError?.message ?? 'no id returned'}`);
        continue;
      }

      // 2. Create the Studio draft, anchored to the CI UUID
      const personalized = personalizeSections(
        sopContentToSections(content),
        companyName,
      );

      const studioRow = {
        template_id: ci.id,
        company_id: companyId,
        name: fullName,
        type: 'SOP',
        sections: personalized as unknown as Json,
        metadata: {
          sopNumber: content.sopNumber,
          seededFrom: 'tier-a-auto-seed',
          seededAt: new Date().toISOString(),
        } as unknown as Json,
      };

      const { error: studioError } = await supabase
        .from('document_studio_templates')
        .insert(studioRow);

      if (studioError) {
        result.failed++;
        result.errors.push(`${sopKey}: Studio draft insert failed — ${studioError.message}`);
        continue;
      }

      result.inserted++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${sopKey}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Auto-seed all Tier A SOPs for a freshly-created company.
 * Safe to call multiple times — existing SOPs are skipped.
 */
export async function seedTierASopsForCompany(
  companyId: string,
  companyName: string,
): Promise<SopSeedResult> {
  return seedSopsForCompany(
    companyId,
    companyName,
    TIER_A_AUTO_SEED.map((e) => e.sop),
  );
}

/**
 * Manually seed Tier B SOPs whose triggers match the supplied flags.
 * Pass `triggers` set of enabled regulatory contexts; SOPs whose trigger
 * is in the set (or `'always'`) will be seeded.
 */
export async function seedTierBSopsForCompany(
  companyId: string,
  companyName: string,
  triggers: ReadonlySet<TierBSop['trigger']>,
): Promise<SopSeedResult> {
  const sopKeys = TIER_B_CONDITIONAL
    .filter((entry) => entry.trigger === 'always' || triggers.has(entry.trigger))
    .map((entry) => entry.sop);
  return seedSopsForCompany(companyId, companyName, sopKeys);
}

/**
 * Convenience: seed every Tier B SOP regardless of trigger (used by the
 * super-admin "Seed all Tier B" button).
 */
export async function seedAllTierBSopsForCompany(
  companyId: string,
  companyName: string,
): Promise<SopSeedResult> {
  return seedSopsForCompany(
    companyId,
    companyName,
    TIER_B_CONDITIONAL.map((e) => e.sop),
  );
}

/**
 * Count auto-seeded Tier A SOPs already present for a company.
 */
export async function countTierASopsPresent(companyId: string): Promise<number> {
  if (!companyId) return 0;
  const { data, error } = await supabase
    .from('phase_assigned_document_template')
    .select('name')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');

  if (error || !data) return 0;
  const names = new Set(data.map((r) => normalizeTitle(r.name ?? '')));
  let count = 0;
  for (const entry of TIER_A_AUTO_SEED) {
    const c = SOP_FULL_CONTENT[entry.sop];
    if (c && names.has(normalizeTitle(`${c.sopNumber} ${c.title}`))) count++;
  }
  return count;
}

/**
 * Seed a single SOP for a company. Used by the per-row "Use Template"
 * action in the Templates list. Delegates to the same idempotent core
 * seeder used at company creation, so personalization (e.g. `[Company
 * Name]` substitution) and CI/Studio creation behave identically.
 */
export async function seedSingleSopForCompany(
  companyId: string,
  companyName: string,
  sopKey: string,
): Promise<SopSeedResult> {
  return seedSopsForCompany(companyId, companyName, [sopKey]);
}
