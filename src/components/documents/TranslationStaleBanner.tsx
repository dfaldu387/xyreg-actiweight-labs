import * as React from 'react';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isTranslationStale } from '@/utils/translationStaleness';
import {
  markTranslationResynced,
  retranslateFromSource,
} from '@/services/translationSyncService';

interface TranslationStaleBannerProps {
  /** CI id of the (possibly translated) document open in the drawer. */
  documentCiId: string | null | undefined;
  /** Called after a successful re-sync so the parent can refetch. */
  onResynced?: () => void;
}

interface TranslationRow {
  id: string;
  language_code: string | null;
  source_document_id: string | null;
  translation_synced_at: string | null;
}

/**
 * Renders an amber banner inside the document drawer when the open document
 * is a translation whose English master has changed since the last sync.
 * Hidden completely for non-translations and for in-sync translations.
 */
export function TranslationStaleBanner({
  documentCiId,
  onResynced,
}: TranslationStaleBannerProps) {
  const [translation, setTranslation] = useState<TranslationRow | null>(null);
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<'idle' | 'mark' | 'retranslate'>('idle');

  useEffect(() => {
    let cancelled = false;
    setTranslation(null);
    setSourceUpdatedAt(null);
    if (!documentCiId) return;
    (async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, language_code, source_document_id, translation_synced_at')
        .eq('id', documentCiId)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const row = data as TranslationRow;
      setTranslation(row);
      if (row.source_document_id) {
        const { data: src } = await supabase
          .from('phase_assigned_document_template')
          .select('updated_at')
          .eq('id', row.source_document_id)
          .maybeSingle();
        if (cancelled) return;
        setSourceUpdatedAt((src as any)?.updated_at ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentCiId]);

  if (!translation || !translation.language_code || !translation.source_document_id) {
    return null;
  }
  const stale = isTranslationStale(translation, sourceUpdatedAt);
  if (!stale) return null;

  const handleMark = async () => {
    if (!translation.id) return;
    setBusy('mark');
    const res = await markTranslationResynced(translation.id);
    setBusy('idle');
    if (!res.success) {
      toast.error(res.error || 'Could not mark as re-translated');
      return;
    }
    toast.success('Marked as re-translated');
    setTranslation((t) =>
      t ? { ...t, translation_synced_at: new Date().toISOString() } : t,
    );
    onResynced?.();
  };

  const handleRetranslate = async () => {
    if (!translation.id || !translation.source_document_id || !translation.language_code) return;
    setBusy('retranslate');
    const res = await retranslateFromSource({
      translationCiId: translation.id,
      sourceCiId: translation.source_document_id,
      languageCode: translation.language_code,
    });
    setBusy('idle');
    if (!res.success) {
      toast.error(res.error || 'Re-translation failed');
      return;
    }
    toast.success('Translation refreshed from English master');
    setTranslation((t) =>
      t ? { ...t, translation_synced_at: new Date().toISOString() } : t,
    );
    onResynced?.();
  };

  const updatedLabel = sourceUpdatedAt
    ? new Date(sourceUpdatedAt).toLocaleString()
    : null;

  return (
    <div className="mx-3 my-2 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
      <div className="flex-1">
        <div className="font-medium">
          The English master has changed since this {translation.language_code} translation was last synced.
        </div>
        {updatedLabel && (
          <div className="text-xs text-amber-800/80">
            Master last updated {updatedLabel}.
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          onClick={handleRetranslate}
          disabled={busy !== 'idle'}
        >
          {busy === 'retranslate' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Re-translate with AI
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-amber-900 hover:bg-amber-100"
          onClick={handleMark}
          disabled={busy !== 'idle'}
        >
          {busy === 'mark' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Check className="mr-1 h-3 w-3" />
          )}
          Mark re-translated
        </Button>
      </div>
    </div>
  );
}
