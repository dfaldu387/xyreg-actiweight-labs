import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentCategoryConfigs } from './useDocumentCategoryConfigs';
import { useSubPrefixes } from './useSubPrefixes';

/**
 * Builds a compact block of numbering facts about the current draft to inject
 * into AI prompts so the assistant emits IDs in the correct
 * TYPE-SUBPREFIX-NUMBER format and uses the real next-available number.
 */
export function useDocumentNumberingContext(
  documentId: string | null | undefined,
  companyId: string | undefined,
) {
  const [documentType, setDocumentType] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [nextAvailable, setNextAvailable] = useState<string>('');
  const { subPrefixes } = useSubPrefixes(companyId || '');
  const { getNextDocumentNumber } = useDocumentCategoryConfigs(companyId);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('document_studio_templates')
        .select('metadata, document_control')
        .eq('id', documentId)
        .maybeSingle();
      if (cancelled) return;
      const meta = (data?.metadata || {}) as Record<string, unknown>;
      const control = (data?.document_control || {}) as Record<string, unknown>;
      const dt = (meta.document_type ?? control.document_type ?? '') as string;
      const dn = (meta.document_number ?? control.document_number ?? '') as string;
      setDocumentType(dt || '');
      setDocumentNumber(dn || '');
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  // Parse sub-prefix out of the existing number (if any)
  let subPrefixCode = '';
  let subPrefixLabel = '';
  if (documentNumber && documentType && subPrefixes.length > 0) {
    const withoutPrefix = documentNumber.replace(`${documentType}-`, '');
    const match = subPrefixes.find(sp => withoutPrefix.startsWith(`${sp.code}-`));
    if (match) {
      subPrefixCode = match.code;
      subPrefixLabel = match.label;
    }
  }

  // Compute next available whenever type/sub-prefix change
  useEffect(() => {
    if (!documentType) { setNextAvailable(''); return; }
    let cancelled = false;
    (async () => {
      const next = await getNextDocumentNumber(documentType, subPrefixCode || undefined);
      if (!cancelled) setNextAvailable(next || '');
    })();
    return () => { cancelled = true; };
  }, [documentType, subPrefixCode, getNextDocumentNumber]);

  if (!documentType && !documentNumber) return '';

  const lines: string[] = ['--- CURRENT DRAFT NUMBERING ---'];
  if (documentType) lines.push(`Document Type (prefix): ${documentType}`);
  if (subPrefixCode) lines.push(`Sub-prefix: ${subPrefixCode}${subPrefixLabel ? ` (${subPrefixLabel})` : ''}`);
  if (documentNumber) lines.push(`Current Document ID: ${documentNumber}`);
  if (nextAvailable && nextAvailable !== documentNumber) {
    lines.push(`Next available Document ID: ${nextAvailable}`);
  }
  lines.push('When you need to reference or fill in this draft\'s ID, use the exact value above. Never invent IDs and never reverse the order (always TYPE-SUBPREFIX-NUMBER).');
  lines.push('--- END CURRENT DRAFT NUMBERING ---');
  return lines.join('\n');
}
