import { supabase } from '@/integrations/supabase/client';

/**
 * Mark a translated CI as freshly synced with its English master.
 * Use this when the user has manually updated the translation to match the
 * latest source content.
 */
export async function markTranslationResynced(
  translationCiId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('phase_assigned_document_template')
    .update({ translation_synced_at: new Date().toISOString() })
    .eq('id', translationCiId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Re-translate the source CI's studio sections into the target language and
 * write them onto the translation's studio draft, then mark synced.
 *
 * Returns success when the translation has been updated.
 */
export async function retranslateFromSource(params: {
  translationCiId: string;
  sourceCiId: string;
  languageCode: string;
}): Promise<{ success: boolean; error?: string }> {
  const { translationCiId, sourceCiId, languageCode } = params;
  try {
    // Locate the source studio draft anchored to the source CI.
    const { data: sourceStudio, error: srcError } = await supabase
      .from('document_studio_templates')
      .select('sections')
      .eq('template_id', sourceCiId)
      .maybeSingle();
    if (srcError) throw srcError;
    const sectionsArray = Array.isArray(sourceStudio?.sections)
      ? (sourceStudio!.sections as any[])
      : [];

    let translatedSections: any[] = sectionsArray;
    if (sectionsArray.length > 0) {
      const payloadSections = sectionsArray.map((s: any, idx: number) => ({
        id: String(s.id ?? idx),
        title: s.title ?? s.heading ?? '',
        content: s.content ?? s.html ?? '',
      }));
      const { data: tData, error: tError } = await supabase.functions.invoke(
        'translate-document-sections',
        {
          body: {
            sections: payloadSections,
            targetLanguage: languageCode,
            sourceLanguage: 'EN',
          },
        },
      );
      if (tError) throw tError;
      const returned: any[] = (tData as any)?.sections || [];
      const byId = new Map(returned.map((s: any) => [String(s.id), s.content]));
      translatedSections = sectionsArray.map((s: any, idx: number) => {
        const newContent = byId.get(String(s.id ?? idx));
        if (newContent === undefined) return s;
        if ('content' in s) return { ...s, content: newContent };
        if ('html' in s) return { ...s, html: newContent };
        return { ...s, content: newContent };
      });
    }

    // Write translated sections onto the translation's studio draft.
    const { error: updErr } = await supabase
      .from('document_studio_templates')
      .update({ sections: translatedSections, updated_at: new Date().toISOString() })
      .eq('template_id', translationCiId);
    if (updErr) throw updErr;

    const marked = await markTranslationResynced(translationCiId);
    if (!marked.success) return marked;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Re-translation failed' };
  }
}
