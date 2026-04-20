import { supabase } from '@/integrations/supabase/client';

const NA = '—';
const fmt = (v: unknown) => (v == null || v === '' ? NA : String(v));

const CONTENT_CHAR_BUDGET = 8000;

function sectionsToPlainText(sections: unknown): string {
  if (!Array.isArray(sections)) return '';
  return sections
    .slice()
    .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((section: any) => {
      const title = section?.customTitle || section?.title || '';
      const items = Array.isArray(section?.content) ? section.content : [];
      const body = items
        .map((item: any) => String(item?.content || '').replace(/<[^>]*>/g, '').trim())
        .filter(Boolean)
        .join('\n');
      return title || body ? `## ${title}\n${body}`.trim() : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Slug used as the `@mention` value for a company document, so the user can
 * type `@design-and-development` and we map it back to the real row.
 */
export function slugifyDocName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetches the given company SOP documents by id and returns a Markdown-styled
 * snapshot for injection into an AI prompt. Pulls the same columns rendered in
 * the Compliance Instances Documents list, plus descriptive fields the AI can
 * reason over (description, brief_summary, sub_section, author, version).
 */
export async function fetchLiveSopDocumentSnapshot(
  companyId: string,
  ids: string[],
): Promise<string> {
  if (!companyId || ids.length === 0) return '';
  try {
    const [metaResult, contentResult] = await Promise.all([
      supabase
        .from('phase_assigned_document_template')
        .select(
          'id, name, document_type, status, description, brief_summary, sub_section, document_reference, document_number, version, date, due_date, approval_date, author, tech_applicability',
        )
        .eq('company_id', companyId)
        .in('id', ids),
      supabase
        .from('document_studio_templates')
        .select('template_id, sections, updated_at')
        .eq('company_id', companyId)
        .in('template_id', ids),
    ]);

    if (metaResult.error) {
      console.warn('[liveSopDocumentSnapshot] meta fetch error', metaResult.error);
      return '';
    }
    const rows = (metaResult.data || []) as any[];
    if (rows.length === 0) return '';

    // Keep only the most recently updated studio draft per template_id.
    const contentByCi = new Map<string, { sections: unknown; updated_at: string | null }>();
    for (const row of (contentResult.data || []) as any[]) {
      const existing = contentByCi.get(row.template_id);
      if (!existing || (row.updated_at && (!existing.updated_at || row.updated_at > existing.updated_at))) {
        contentByCi.set(row.template_id, { sections: row.sections, updated_at: row.updated_at });
      }
    }

    const lines: string[] = [];
    lines.push('--- REFERENCED COMPANY SOP DOCUMENT(S) (LIVE) ---');
    lines.push(`Fetched at: ${new Date().toISOString()}`);
    for (const d of rows) {
      lines.push('');
      lines.push(`### ${fmt(d.name)}`);
      lines.push(`- Type: ${fmt(d.document_type)}`);
      lines.push(`- Status: ${fmt(d.status)}`);
      lines.push(`- Reference: ${fmt(d.document_reference || d.document_number)}`);
      lines.push(`- Version: ${fmt(d.version)}`);
      lines.push(`- Date: ${fmt(d.date)} | Due: ${fmt(d.due_date)} | Approved: ${fmt(d.approval_date)}`);
      lines.push(`- Author: ${fmt(d.author)}`);
      lines.push(`- Applicability: ${fmt(d.tech_applicability)}`);
      lines.push(`- Sub-section: ${fmt(d.sub_section)}`);
      lines.push(`- Brief summary: ${fmt(d.brief_summary)}`);
      lines.push(`- Description: ${fmt(d.description)}`);

      const studio = contentByCi.get(d.id);
      const body = studio ? sectionsToPlainText(studio.sections) : '';
      lines.push('');
      lines.push('#### Content');
      if (body) {
        const truncated = body.length > CONTENT_CHAR_BUDGET;
        lines.push(truncated ? `${body.slice(0, CONTENT_CHAR_BUDGET)}\n\n…[truncated]` : body);
      } else {
        lines.push('(No draft content has been saved for this SOP yet.)');
      }
    }
    lines.push('');
    lines.push('Ground every answer about the referenced SOP(s) strictly in the fields and Content above. If a field shows "—" or the Content section says no draft has been saved, say it is not set — do not invent values.');
    lines.push('--- END REFERENCED SOP DOCUMENT(S) ---');
    return lines.join('\n');
  } catch (err) {
    console.warn('[liveSopDocumentSnapshot] unexpected error', err);
    return '';
  }
}
