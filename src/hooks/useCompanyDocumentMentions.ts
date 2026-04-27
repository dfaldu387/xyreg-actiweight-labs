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
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_reference, status, document_type')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('name');
      if (cancelled) return;
      if (error || !data) {
        setItems([]);
        return;
      }
      const seen = new Set<string>();
      const out: CompanyDocumentMention[] = [];
      for (const r of data as any[]) {
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
        });
      }
      setItems(out);
    })();
    return () => { cancelled = true; };
  }, [companyId, enabled]);

  return items;
}
