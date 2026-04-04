import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shared hook that determines which documents the current user can access.
 * - Admins/consultants/super_admins: no filtering (allowedDocumentIds = null)
 * - Non-admin users: only documents listed in their user_document_permissions.document_ids array
 *   scoped to the current company
 */
export function useUserDocumentAccess() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useEffectiveUserRole();
  const { activeCompanyRole } = useCompanyRole();
  const companyId = activeCompanyRole?.companyId;
  const [allowedDocumentIds, setAllowedDocumentIds] = useState<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;

    // Admins get full access
    if (isAdmin || !user?.id) {
      setAllowedDocumentIds(null);
      setIsLoading(false);
      return;
    }

    if (!companyId) {
      setAllowedDocumentIds(null);
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('user_document_permissions')
          .select('document_ids')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching document permissions:', error);
          setAllowedDocumentIds(null);
        } else {
          const ids = data?.document_ids;
          // Empty or null document_ids means all access
          if (!ids || ids.length === 0) {
            setAllowedDocumentIds(null);
          } else {
            setAllowedDocumentIds(new Set(ids));
          }
        }
      } catch (err) {
        console.error('Error fetching document permissions:', err);
        setAllowedDocumentIds(new Set());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id, isAdmin, roleLoading, companyId]);

  const filterDocumentsByAccess = useCallback(
    <T extends { id: string }>(docs: T[]): T[] => {
      if (allowedDocumentIds === null) return docs;
      return docs.filter(doc => allowedDocumentIds.has(doc.id));
    },
    [allowedDocumentIds]
  );

  return useMemo(() => ({
    isAdmin,
    allowedDocumentIds,
    isLoading: isLoading || roleLoading,
    filterDocumentsByAccess,
  }), [isAdmin, allowedDocumentIds, isLoading, roleLoading, filterDocumentsByAccess]);
}
