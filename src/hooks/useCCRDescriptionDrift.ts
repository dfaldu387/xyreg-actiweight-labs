import { useMemo } from 'react';
import {
  extractReferencedDocTokens,
  canonicaliseDocToken,
  type LinkedCCRDoc,
} from '@/services/ccrLinkedDocsService';

export interface CCRDescriptionDrift {
  /** Tokens mentioned in description but not present in linked docs. */
  stale: string[];
  /** Linked doc tokens not mentioned in the description. */
  missing: string[];
  hasDrift: boolean;
}

/**
 * Compares CCR description text against the actual linked Document CIs and
 * reports two-way drift. Pure derivation — no network.
 *
 * See `.lovable/plan.md` Part 2 — CCR description sync.
 */
export function useCCRDescriptionDrift(
  description: string | null | undefined,
  linkedDocs: LinkedCCRDoc[] | null | undefined,
): CCRDescriptionDrift {
  return useMemo(() => {
    const mentioned = new Set(extractReferencedDocTokens(description));
    const linkedTokens = new Set<string>();
    for (const d of linkedDocs || []) {
      const t =
        canonicaliseDocToken(d.document_reference) ||
        canonicaliseDocToken(d.document_number) ||
        canonicaliseDocToken(d.name);
      if (t) linkedTokens.add(t);
    }
    const stale: string[] = [];
    const missing: string[] = [];
    mentioned.forEach((t) => {
      if (!linkedTokens.has(t)) stale.push(t);
    });
    linkedTokens.forEach((t) => {
      if (!mentioned.has(t)) missing.push(t);
    });
    return { stale, missing, hasDrift: stale.length > 0 || missing.length > 0 };
  }, [description, linkedDocs]);
}
