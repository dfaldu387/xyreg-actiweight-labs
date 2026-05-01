/**
 * FPD (Foundation / Pathway / Device-specific) SOP Catalog service.
 *
 * The catalog holds the 51 standard SOPs (28 Foundation + 15 Pathway +
 * 8 Device-specific) as editable database rows. Super Admins manage these
 * entries; the seeding services read from this table when provisioning new
 * companies.
 *
 * Bridge to uploads: rows in `default_document_templates` may carry an
 * optional `fpd_sop_key` linking an uploaded .docx/.pdf to a catalog entry.
 * When set, the file becomes the default attachment for that FPD SOP and
 * is propagated to every newly seeded company instance.
 */
import { supabase } from '@/integrations/supabase/client';
import type { SOPSectionContent } from '@/data/sopContent/types';
import { SOP_FULL_CONTENT } from '@/data/sopFullContent';

export type FpdTier = 'foundation' | 'pathway' | 'device_specific';

export interface FpdSopCatalogEntry {
  id: string;
  sop_key: string;
  tier: FpdTier;
  title: string;
  description: string | null;
  rationale: string | null;
  trigger: string | null;
  default_content: unknown | null;
  default_sections: SOPSectionContent[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FpdCatalogUpdate {
  title?: string;
  description?: string | null;
  rationale?: string | null;
  trigger?: string | null;
  is_active?: boolean;
  default_sections?: SOPSectionContent[];
}

export const TIER_LABELS: Record<FpdTier, string> = {
  foundation: 'Foundation',
  pathway: 'Pathway',
  device_specific: 'Device-specific',
};

export const TIER_BADGE_CLASSES: Record<FpdTier, string> = {
  foundation:
    'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
  pathway:
    'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700',
  device_specific:
    'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
};

export class FpdSopCatalogService {
  /** All 51 entries, ordered by sort_order (matches SOP-NNN sequence). */
  static async list(): Promise<FpdSopCatalogEntry[]> {
    const { data, error } = await supabase
      .from('fpd_sop_catalog' as never)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('[FpdSopCatalogService.list]', error);
      throw new Error(error.message);
    }
    const rows = (data as unknown as FpdSopCatalogEntry[]) ?? [];
    // Backfill from the hardcoded library when DB row hasn't been edited yet,
    // so the editor always shows the canonical starting point.
    return rows.map((r) => ({
      ...r,
      default_sections:
        Array.isArray(r.default_sections) && r.default_sections.length > 0
          ? r.default_sections
          : SOP_FULL_CONTENT[r.sop_key]?.sections ?? [],
    }));
  }

  /** Lightweight option list for the upload dialog combobox. */
  static async listOptions(): Promise<
    Array<{ sop_key: string; tier: FpdTier; title: string }>
  > {
    const { data, error } = await supabase
      .from('fpd_sop_catalog' as never)
      .select('sop_key, tier, title')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('[FpdSopCatalogService.listOptions]', error);
      throw new Error(error.message);
    }
    return (data as unknown as Array<{
      sop_key: string;
      tier: FpdTier;
      title: string;
    }>) ?? [];
  }

  static async update(id: string, patch: FpdCatalogUpdate): Promise<void> {
    const { error } = await supabase
      .from('fpd_sop_catalog' as never)
      .update(patch as never)
      .eq('id', id);
    if (error) {
      console.error('[FpdSopCatalogService.update]', error);
      throw new Error(error.message);
    }
  }

  /** Library default sections for a given SOP key (used by "Reset" button). */
  static libraryDefaultSections(sopKey: string): SOPSectionContent[] {
    return SOP_FULL_CONTENT[sopKey]?.sections ?? [];
  }

  /**
   * Read the editable section body for a SOP key. Prefers the DB-edited
   * `default_sections` and falls back to the hardcoded library. Used by
   * auto-seed services when provisioning new companies.
   */
  static async resolveSections(sopKey: string): Promise<SOPSectionContent[]> {
    const { data, error } = await supabase
      .from('fpd_sop_catalog' as never)
      .select('default_sections')
      .eq('sop_key', sopKey)
      .maybeSingle();
    if (error) {
      console.warn('[FpdSopCatalogService.resolveSections]', error);
      return SOP_FULL_CONTENT[sopKey]?.sections ?? [];
    }
    const sections = (data as { default_sections?: SOPSectionContent[] } | null)
      ?.default_sections;
    if (Array.isArray(sections) && sections.length > 0) return sections;
    return SOP_FULL_CONTENT[sopKey]?.sections ?? [];
  }
}