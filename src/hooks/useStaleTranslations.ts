import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { isTranslationStale } from '@/utils/translationStaleness';

export interface StaleTranslationItem {
  id: string;
  name: string;
  documentNumber?: string;
  type: string;
  languageCode: string;
  companyId: string;
  productId?: string;
  sourceUpdatedAt: string;
  translationSyncedAt: string | null;
}

/**
 * Returns translations the current user is responsible for whose master
 * (English source) document has been updated more recently than the
 * translation's last sync timestamp.
 *
 * Mirrors the responsibility scoping used by MyDocumentsWidget so users only
 * see stale translations they actually own (author / reviewer / approver /
 * starred).
 */
export function useStaleTranslations(companyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stale-translations', user?.id, companyId],
    queryFn: async (): Promise<StaleTranslationItem[]> => {
      if (!user?.id) return [];

      // 1. User's reviewer/approver group memberships
      const { data: membershipData } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      const userGroupIds = (membershipData || []).map(m => m.group_id);

      // 2. Starred document ids
      const { data: stars } = await supabase
        .from('document_stars')
        .select('document_id')
        .eq('user_id', user.id);
      const starredIds = (stars || []).map(s => s.document_id);

      // 3. Responsibility OR filter (matches MyDocumentsWidget)
      const orParts: string[] = [
        `uploaded_by.eq.${user.id}`,
        `approved_by.eq.${user.id}`,
        `approver_user_ids.cs.{${user.id}}`,
        `reviewer_user_ids.cs.{${user.id}}`,
        `authors_ids.cs.["${user.id}"]`,
      ];
      if (userGroupIds.length > 0) {
        orParts.push(`reviewer_group_ids.ov.{${userGroupIds.join(',')}}`);
        orParts.push(`approver_group_ids.ov.{${userGroupIds.join(',')}}`);
      }

      // 4. Translations the user is responsible for
      let respQuery = supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, document_number, language_code, source_document_id, translation_synced_at, company_id, product_id')
        .eq('is_excluded', false)
        .not('language_code', 'is', null)
        .not('source_document_id', 'is', null)
        .or(orParts.join(','));
      if (companyId) respQuery = respQuery.eq('company_id', companyId);
      const { data: respDocs } = await respQuery;

      // 5. Translations the user has starred (may overlap)
      let starredDocs: any[] = [];
      if (starredIds.length > 0) {
        let starQuery = supabase
          .from('phase_assigned_document_template')
          .select('id, name, document_type, document_number, language_code, source_document_id, translation_synced_at, company_id, product_id')
          .eq('is_excluded', false)
          .not('language_code', 'is', null)
          .not('source_document_id', 'is', null)
          .in('id', starredIds);
        if (companyId) starQuery = starQuery.eq('company_id', companyId);
        const { data } = await starQuery;
        starredDocs = data || [];
      }

      // 6. Merge & dedupe
      const seen = new Set<string>();
      const translations = [...(respDocs || []), ...starredDocs].filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

      if (translations.length === 0) return [];

      // 7. Batch-fetch master updated_at timestamps
      const sourceIds = [...new Set(translations.map(t => t.source_document_id).filter(Boolean))] as string[];
      const sourceMap = new Map<string, string>();
      if (sourceIds.length > 0) {
        const { data: sources } = await supabase
          .from('phase_assigned_document_template')
          .select('id, updated_at')
          .in('id', sourceIds);
        (sources || []).forEach(s => {
          if (s.updated_at) sourceMap.set(s.id, s.updated_at);
        });
      }

      // 8. Filter to stale ones
      const stale: StaleTranslationItem[] = [];
      for (const t of translations) {
        const sourceUpdatedAt = sourceMap.get(t.source_document_id as string);
        if (!sourceUpdatedAt) continue;
        if (
          !isTranslationStale(
            {
              language_code: t.language_code,
              source_document_id: t.source_document_id,
              translation_synced_at: t.translation_synced_at,
            },
            sourceUpdatedAt,
          )
        ) continue;
        stale.push({
          id: t.id,
          name: t.name || 'Untitled',
          documentNumber: t.document_number || undefined,
          type: t.document_type || 'document',
          languageCode: (t.language_code || '').toUpperCase(),
          companyId: t.company_id || '',
          productId: t.product_id || undefined,
          sourceUpdatedAt,
          translationSyncedAt: t.translation_synced_at || null,
        });
      }

      // 9. Most-recently-updated master first
      stale.sort((a, b) => new Date(b.sourceUpdatedAt).getTime() - new Date(a.sourceUpdatedAt).getTime());
      return stale;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}