import { useQuery } from '@tanstack/react-query';
import { fetchLinkedDocs, type LinkedCCRDoc } from '@/services/ccrLinkedDocsService';
import { splitDocPrefix } from '@/utils/templateNameUtils';
import { formatSopDisplayId } from '@/constants/sopAutoSeedTiers';

/**
 * Returns the number of CCR-linked documents AFTER de-duplicating rows
 * that share the same display reference (e.g. two CIs both numbered
 * SOP-030). Mirrors the dedup performed inside CCRLinkedDocuments so the
 * tab badge and the panel always agree.
 */
export function useCCRLinkedDocsDedupedCount(ccrId: string, linkedIds: string[]) {
  const { data: rawDocs = [] } = useQuery({
    queryKey: ['ccr-linked-docs', ccrId, linkedIds.join(',')],
    queryFn: () => fetchLinkedDocs(linkedIds),
    enabled: linkedIds.length > 0,
  });

  if (linkedIds.length === 0) return 0;
  if (rawDocs.length === 0) return linkedIds.length; // loading fallback

  const seen = new Set<string>();
  let withoutRef = 0;
  for (const d of rawDocs as LinkedCCRDoc[]) {
    const ref = d.document_reference || '';
    const isPlaceholder = ref && /^DS-[0-9a-f-]{8,}/i.test(ref);
    const rawRef = d.document_number || (isPlaceholder ? '' : ref) || '';
    const displayRef = /^SOP-\d{3}$/i.test(rawRef)
      ? formatSopDisplayId(rawRef.toUpperCase())
      : rawRef;
    const key = displayRef.trim().toLowerCase();
    if (!key) {
      withoutRef += 1;
      continue;
    }
    seen.add(key);
  }
  return seen.size + withoutRef;
}
