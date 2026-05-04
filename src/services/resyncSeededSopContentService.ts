/**
 * Re-sync seeded SOP draft content from the static `SOP_FULL_CONTENT`
 * library into existing company drafts.
 *
 * Why this exists
 * ----------------
 * The Tier-A / Tier-B seed pipeline (`sopAutoSeedService`) reads the static
 * SOP content **once** at company-creation time and writes the section
 * bodies into `document_studio_templates`. After that, edits to the static
 * source files (e.g. adding the missing `WI`, `DCO`, `ECO` definitions and
 * "Related Work Instructions" lines) never reach existing company drafts.
 *
 * This service performs a one-time, idempotent backfill of just the two
 * sections that the recent patch touched:
 *
 *   - 3.0 References  (id: `references`)
 *   - 4.0 Definitions & Abbreviations  (id: `definitions`)
 *
 * All other sections (Procedure, Responsibilities, Records, Revision
 * History, …) are deliberately left alone so user edits are preserved.
 *
 * Idempotent: skips any draft whose two sections already match the
 * (personalized) source content.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { SOP_FULL_CONTENT, sopContentToSections } from '@/data/sopFullContent';
import { rewriteAllSopTokens } from '@/constants/sopAutoSeedTiers';

const COMPANY_NAME_PLACEHOLDER = /\[Company Name\]/g;
const SECTIONS_TO_RESYNC = new Set(['references', 'definitions']);

export interface ResyncResult {
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface StudioBlock {
  id?: string;
  type?: 'paragraph' | 'heading';
  content?: unknown;
  isAIGenerated?: boolean;
  metadata?: Record<string, unknown>;
}

interface StudioSection {
  id: string;
  title?: string;
  order?: number;
  content: StudioBlock[];
}

function personalizeBlockText(text: string, companyName: string): string {
  return rewriteAllSopTokens(text.replace(COMPANY_NAME_PLACEHOLDER, companyName));
}

function blocksTextSignature(blocks: StudioBlock[] | undefined): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((b) => `${b.type ?? 'paragraph'}::${typeof b.content === 'string' ? b.content : JSON.stringify(b.content)}`)
    .join('\n');
}

/**
 * Re-sync the References + Definitions sections on every existing seeded
 * SOP draft for the given company. Safe to call repeatedly.
 */
export async function resyncSeededSopContent(
  companyId: string,
  companyName: string,
): Promise<ResyncResult> {
  const result: ResyncResult = { updated: 0, skipped: 0, failed: 0, errors: [] };
  if (!companyId || !companyName) return result;

  // 1. Pull every Studio draft for this company that looks like a seeded SOP.
  const { data: drafts, error } = await supabase
    .from('document_studio_templates')
    .select('id, name, sections, metadata')
    .eq('company_id', companyId)
    .eq('type', 'SOP');

  if (error) {
    result.errors.push(`Failed to load SOP drafts: ${error.message}`);
    return result;
  }
  if (!drafts || drafts.length === 0) return result;

  for (const draft of drafts) {
    try {
      // Resolve the canonical SOP key from the draft metadata or name.
      const meta = (draft.metadata ?? {}) as { sopNumber?: string; document_number?: string };
      const docNum = (meta.sopNumber ?? meta.document_number ?? '').toUpperCase();
      // Source library is keyed as "SOP-001", strip any sub-prefix.
      const numMatch = docNum.match(/SOP-(?:[A-Z]+-)?(\d{3})/) ?? draft.name?.match(/SOP-(?:[A-Z]+-)?(\d{3})/);
      if (!numMatch) {
        result.skipped++;
        continue;
      }
      const sourceKey = `SOP-${numMatch[1]}`;
      const source = SOP_FULL_CONTENT[sourceKey];
      if (!source) {
        result.skipped++;
        continue;
      }

      const sourceSections = sopContentToSections(source);
      const sourceById = new Map(sourceSections.map((s) => [s.id, s]));

      const existingSections = (draft.sections as unknown as StudioSection[]) ?? [];
      if (!Array.isArray(existingSections) || existingSections.length === 0) {
        result.skipped++;
        continue;
      }

      let mutated = false;
      const next = existingSections.map((section) => {
        if (!SECTIONS_TO_RESYNC.has(section.id)) return section;
        const fresh = sourceById.get(section.id);
        if (!fresh) return section;
        // Personalize each block's text using the same pipeline as the seeder.
        const personalizedBlocks: StudioBlock[] = fresh.content.map((b) => ({
          ...b,
          content:
            typeof b.content === 'string' ? personalizeBlockText(b.content, companyName) : b.content,
        }));
        const beforeSig = blocksTextSignature(section.content);
        const afterSig = blocksTextSignature(personalizedBlocks);
        if (beforeSig === afterSig) return section;
        mutated = true;
        return { ...section, content: personalizedBlocks };
      });

      if (!mutated) {
        result.skipped++;
        continue;
      }

      const { error: upErr } = await supabase
        .from('document_studio_templates')
        .update({ sections: next as unknown as Json })
        .eq('id', draft.id);
      if (upErr) {
        result.failed++;
        result.errors.push(`${draft.name}: ${upErr.message}`);
        continue;
      }
      result.updated++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${draft.name}: ${(err as Error).message}`);
    }
  }

  return result;
}

/**
 * Backfill the "5. Reference" section on existing seeded WI drafts so the
 * parent SOP number (e.g. `SOP-DE-005`) appears in the text. The LiveEditor's
 * reference annotator then renders it as a clickable chip that opens the
 * parent SOP draft.
 *
 * Idempotent: skips any WI whose Reference paragraph already contains the
 * parent SOP number.
 */
export async function resyncWiReferences(companyId: string): Promise<ResyncResult> {
  const result: ResyncResult = { updated: 0, skipped: 0, failed: 0, errors: [] };
  if (!companyId) return result;

  // Pull every Studio draft for the company that looks like a WI.
  const { data: drafts, error } = await supabase
    .from('document_studio_templates')
    .select('id, name, sections, metadata')
    .eq('company_id', companyId)
    .eq('type', 'WI');

  if (error) {
    result.errors.push(`Failed to load WI drafts: ${error.message}`);
    return result;
  }
  if (!drafts || drafts.length === 0) return result;

  // Build a docnum -> title lookup for the company's SOPs so we can render
  // "SOP-DE-005 Design and Development Planning" in the Reference paragraph.
  const { data: sopRows } = await supabase
    .from('documents')
    .select('document_number, title')
    .eq('company_id', companyId);
  const sopTitleByNumber = new Map<string, string>();
  for (const row of sopRows ?? []) {
    const num = (row as { document_number?: string }).document_number;
    const title = (row as { title?: string }).title;
    if (num && title) sopTitleByNumber.set(num.toUpperCase(), title);
  }

  for (const draft of drafts) {
    try {
      const meta = (draft.metadata ?? {}) as { document_number?: string };
      const docNum = (meta.document_number ?? '').toUpperCase();
      const wiMatch = docNum.match(/^WI-([A-Z]{2,4})-(\d{3})-\d+$/);
      if (!wiMatch) {
        result.skipped++;
        continue;
      }
      const parentSopNumber = `SOP-${wiMatch[1]}-${wiMatch[2]}`;
      const parentSopTitle = sopTitleByNumber.get(parentSopNumber) ?? '';

      const existingSections = (draft.sections as unknown as StudioSection[]) ?? [];
      if (!Array.isArray(existingSections) || existingSections.length === 0) {
        result.skipped++;
        continue;
      }

      let mutated = false;
      const next = existingSections.map((section) => {
        if (section.id !== 'reference') return section;
        const blocks = Array.isArray(section.content) ? section.content : [];
        const newBlocks = blocks.map((b) => {
          if (typeof b.content !== 'string') return b;
          const html = b.content;
          // Already linkified — skip.
          if (html.includes(parentSopNumber)) return b;
          // Only rewrite the seed paragraph; leave bespoke content alone.
          const seedRe = /<p>Derived from foundational SOP:\s*([^<.]+)\.<\/p>/i;
          const match = html.match(seedRe);
          if (!match) return b;
          const titleFromHtml = match[1].trim();
          const useTitle = parentSopTitle || titleFromHtml;
          mutated = true;
          return {
            ...b,
            content: `<p>Derived from foundational SOP: ${parentSopNumber} ${useTitle}.</p>`,
          };
        });
        if (!mutated) return section;
        return { ...section, content: newBlocks };
      });

      if (!mutated) {
        result.skipped++;
        continue;
      }

      const { error: upErr } = await supabase
        .from('document_studio_templates')
        .update({ sections: next as unknown as Json })
        .eq('id', draft.id);
      if (upErr) {
        result.failed++;
        result.errors.push(`${draft.name}: ${upErr.message}`);
        continue;
      }
      result.updated++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${draft.name}: ${(err as Error).message}`);
    }
  }

  return result;
}