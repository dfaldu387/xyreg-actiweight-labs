import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isTranslationStale } from '@/utils/translationStaleness';

/**
 * Given a list of documents, returns a map keyed by document id describing
 * whether each translated document is currently out of date relative to its
 * English master.
 *
 * Non-translation rows (no `language_code` / `source_document_id`) are not
 * included in the result.
 */
export interface TranslationStalenessEntry {
  isStale: boolean;
  sourceUpdatedAt: string | null;
}

interface DocLike {
  id: string;
  language_code?: string | null;
  source_document_id?: string | null;
  translation_synced_at?: string | null;
}

export function useTranslationStaleness(documents: DocLike[] | undefined) {
  const sourceIds = useMemo(() => {
    if (!documents) return [] as string[];
    return Array.from(
      new Set(
        documents
          .filter((d) => d.language_code && d.source_document_id)
          .map((d) => d.source_document_id as string),
      ),
    );
  }, [documents]);

  const sourceIdsKey = sourceIds.join('|');
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    if (sourceIds.length === 0) {
      setSourceMap({});
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, updated_at')
        .in('id', sourceIds);
      if (cancelled) return;
      if (error || !data) {
        setSourceMap({});
        return;
      }
      const next: Record<string, string> = {};
      for (const row of data as Array<{ id: string; updated_at: string | null }>) {
        if (row.updated_at) next[row.id] = row.updated_at;
      }
      setSourceMap(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIdsKey]);

  return useMemo(() => {
    const result: Record<string, TranslationStalenessEntry> = {};
    if (!documents) return result;
    for (const d of documents) {
      if (!d.language_code || !d.source_document_id) continue;
      const sourceUpdatedAt = sourceMap[d.source_document_id] ?? null;
      result[d.id] = {
        isStale: isTranslationStale(d, sourceUpdatedAt),
        sourceUpdatedAt,
      };
    }
    return result;
  }, [documents, sourceMap]);
}
