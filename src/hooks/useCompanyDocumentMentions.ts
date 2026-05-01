import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { slugifyDocName } from '@/services/liveSopDocumentSnapshot';

export interface CompanyDocumentMention {
  value: string;
  label: string;
  hint: string;
  id: string;
  name: string;
  document_type?: string;
  document_number?: string;
  document_reference?: string;
}

/**
 * Loads company-scoped documents (SOPs, Clinical Evaluation, Technical File, …)
 * into an @mention list. Mirrors the sopMentions loader in DocumentAIChatPanel
 * so both the AI chat and in-document @mentions stay in sync.
 */
export function useCompanyDocumentMentions(companyId?: string, enabled: boolean = true) {
  const [items, setItems] = useState<CompanyDocumentMention[]>([]);

  useEffect(() => {
    if (!companyId || !enabled) {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // Reference resolution must consider any company-level document the user
      // can already see in their registry — not only `company_document` rows.
      // `company_template` siblings (Core / phase-assigned device docs without a
      // product) own the same document_reference / document_number and also
      // count as "existing" for chip linking. Limiting to a single scope was
      // the reason existing docs (e.g. SOP-MF-020 Labelling, SOP-DE-019)
      // wrongly rendered as missing and triggered the create dialog.
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_reference, document_number, status, document_type, document_scope')
        .eq('company_id', companyId)
        .in('document_scope', ['company_document', 'company_template'])
        .is('product_id', null)
        .neq('is_excluded', true)
        .order('name');
      if (cancelled) return;
      if (error || !data) {
        setItems([]);
        return;
      }
      // Prefer `company_document` rows when the same name appears under both
      // scopes — that scope is what the company documents drawer opens by id.
      const sorted = [...(data as any[])].sort((a, b) => {
        const aw = a.document_scope === 'company_document' ? 0 : 1;
        const bw = b.document_scope === 'company_document' ? 0 : 1;
        return aw - bw;
      });
      const seen = new Set<string>();
      const out: CompanyDocumentMention[] = [];
      for (const r of sorted) {
        const slug = slugifyDocName(r.name || '');
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        const docType = r.document_type || 'Document';
        out.push({
          value: slug,
          label: r.name,
          hint: `${docType}${r.document_reference ? ` · ${r.document_reference}` : ''}${r.status ? ` · ${r.status}` : ''}`,
          id: r.id,
          name: r.name,
          document_type: docType,
          document_number: r.document_number || undefined,
          document_reference: r.document_reference || undefined,
        });
      }
      setItems(out);
    })();
    return () => { cancelled = true; };
  }, [companyId, enabled]);

  return items;
}
