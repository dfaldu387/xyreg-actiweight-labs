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
import { rewriteAllSopTokens } from '@/constants/sopAutoSeedTiers';
import type { SOPSectionContent } from '@/data/sopContent/types';

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
          ? rewriteAllSopTokens(
              block.content.replace(COMPANY_NAME_PLACEHOLDER, companyName),
            )
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

  // Pre-fetch ALL existing SOP CIs for this company so we can detect
  // duplicates regardless of legacy naming. Older rows may be titled by
  // canonical name only (e.g. "Quality Management System") with no
  // "SOP-" prefix, or have a mismatched document_number. We match on
  // BOTH document_number and normalized name/title to prevent the seeder
  // from inserting a second copy.
  const { data: existing } = await supabase
    .from('phase_assigned_document_template')
    .select('name, document_number')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');

  const existingNames = new Set(
    (existing ?? []).map((r) => normalizeTitle(r.name ?? '')),
  );
  const existingNumbers = new Set(
    (existing ?? [])
      .map((r) => (r.document_number ?? '').toUpperCase().trim())
      .filter(Boolean),
  );

  // Pre-fetch any super-admin-edited section bodies from the FPD catalog;
  // these override the hardcoded SOP_FULL_CONTENT for the SOPs being seeded.
  const catalogOverrides = await fetchCatalogSectionOverrides(sopKeys);

  for (const sopKey of sopKeys) {
    const baseContent = SOP_FULL_CONTENT[sopKey];
    if (!baseContent) {
      result.failed++;
      result.errors.push(`${sopKey}: content definition missing`);
      continue;
    }
    const overrideSections = catalogOverrides.get(sopKey);
    const content = overrideSections
      ? { ...baseContent, sections: overrideSections }
      : baseContent;

    const fullName = `${content.sopNumber} ${content.title}`;
    const canonicalNumber = content.sopNumber.toUpperCase().trim();
    const canonicalTitle = normalizeTitle(content.title);
    const fullTitle = normalizeTitle(fullName);

    // Skip if any existing SOP matches by document_number, by full
    // "SOP-XXX Title" name, or by bare canonical title alone (legacy
    // rows often store just the title without the SOP- prefix).
    if (
      existingNumbers.has(canonicalNumber) ||
      existingNames.has(fullTitle) ||
      existingNames.has(canonicalTitle)
    ) {
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
          document_number: content.sopNumber,
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
          document_number: content.sopNumber,
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
 * Fetch super-admin-edited `default_sections` from the FPD catalog for the
 * given SOP keys. Returns a map of sopKey -> sections; entries with empty
 * sections fall through to the hardcoded SOP_FULL_CONTENT library.
 */
async function fetchCatalogSectionOverrides(
  sopKeys: readonly string[],
): Promise<Map<string, SOPSectionContent[]>> {
  const overrides = new Map<string, SOPSectionContent[]>();
  if (sopKeys.length === 0) return overrides;
  try {
    const { data, error } = await supabase
      .from('fpd_sop_catalog' as never)
      .select('sop_key, default_sections')
      .in('sop_key', sopKeys as unknown as string[]);
    if (error) {
      console.warn('[sopAutoSeed] catalog override fetch failed:', error);
      return overrides;
    }
    for (const row of (data as unknown as Array<{
      sop_key: string;
      default_sections: SOPSectionContent[] | null;
    }>) ?? []) {
      if (Array.isArray(row.default_sections) && row.default_sections.length > 0) {
        overrides.set(row.sop_key, row.default_sections);
      }
    }
  } catch (err) {
    console.warn('[sopAutoSeed] catalog override fetch threw:', err);
  }
  return overrides;
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
    .select('name, document_number')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');

  if (error || !data) return 0;
  const names = new Set(data.map((r) => normalizeTitle(r.name ?? '')));
  const numbers = new Set(
    data
      .map((r) => (r.document_number ?? '').toUpperCase().trim())
      .filter(Boolean),
  );
  let count = 0;
  for (const entry of TIER_A_AUTO_SEED) {
    const c = SOP_FULL_CONTENT[entry.sop];
    if (!c) continue;
    const num = c.sopNumber.toUpperCase().trim();
    const full = normalizeTitle(`${c.sopNumber} ${c.title}`);
    const bare = normalizeTitle(c.title);
    if (numbers.has(num) || names.has(full) || names.has(bare)) count++;
  }
  return count;
}

/**
 * Count Tier B (pathway-conditional) SOPs already present for a company.
 */
export async function countTierBSopsPresent(companyId: string): Promise<number> {
  if (!companyId) return 0;
  const { data, error } = await supabase
    .from('phase_assigned_document_template')
    .select('name, document_number')
    .eq('company_id', companyId)
    .eq('document_type', 'SOP');

  if (error || !data) return 0;
  const names = new Set(data.map((r) => normalizeTitle(r.name ?? '')));
  const numbers = new Set(
    data
      .map((r) => (r.document_number ?? '').toUpperCase().trim())
      .filter(Boolean),
  );
  let count = 0;
  for (const entry of TIER_B_CONDITIONAL) {
    const c = SOP_FULL_CONTENT[entry.sop];
    if (!c) continue;
    const num = c.sopNumber.toUpperCase().trim();
    const full = normalizeTitle(`${c.sopNumber} ${c.title}`);
    const bare = normalizeTitle(c.title);
    if (numbers.has(num) || names.has(full) || names.has(bare)) count++;
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
