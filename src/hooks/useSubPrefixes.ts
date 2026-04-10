import { useState, useEffect, useCallback } from 'react';
import { fetchTemplateSettings, saveTemplateSettings } from '@/utils/templateSettingsQueries';
import { SubPrefixEntry, DEFAULT_SUB_PREFIXES } from '@/types/documentCategories';
import type { AuthUser } from '@/services/authService';
import type { Session } from '@supabase/supabase-js';

const SETTING_KEY = 'global_sub_prefixes';

export function useSubPrefixes(companyId: string, user?: AuthUser | null, session?: Session | null) {
  const [subPrefixes, setSubPrefixes] = useState<SubPrefixEntry[]>(DEFAULT_SUB_PREFIXES);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const settings = await fetchTemplateSettings(companyId);
      const existing = settings.find(s => s.setting_key === SETTING_KEY && s.category === 'document_numbering');
      if (existing && Array.isArray(existing.setting_value)) {
        setSubPrefixes(existing.setting_value as unknown as SubPrefixEntry[]);
      }
    } catch (err) {
      console.error('Failed to load sub-prefixes', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (entries: SubPrefixEntry[]) => {
    await saveTemplateSettings(
      companyId,
      [{
        company_id: companyId,
        setting_key: SETTING_KEY,
        setting_value: entries as any,
        setting_type: 'object' as const,
        category: 'document_numbering' as const,
      }],
      user,
      session
    );
    setSubPrefixes(entries);
  }, [companyId, user, session]);

  return { subPrefixes, setSubPrefixes, isLoading, save, reload: load };
}
