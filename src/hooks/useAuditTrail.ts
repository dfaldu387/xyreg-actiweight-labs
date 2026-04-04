import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { AuditTrailService } from '@/services/auditTrailService';
import type { UnifiedAuditTrailEntry, AuditTrailFilters } from '@/types/auditTrail';

interface UseAuditTrailOptions {
  filters: AuditTrailFilters;
  limit?: number;
}

export function useAuditTrail({ filters, limit = 200 }: UseAuditTrailOptions) {
  const { user } = useAuth();
  const { activeCompanyId, activeRole } = useCompanyRole();
  const [entries, setEntries] = useState<UnifiedAuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id || !activeCompanyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await AuditTrailService.getUnifiedAuditTrail(
        activeCompanyId,
        filters,
        limit,
        user.id,
        activeRole
      );

      setEntries(data);
    } catch (err: any) {
      console.error('[useAuditTrail] Error:', err);
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    user?.id,
    activeCompanyId,
    activeRole,
    filters.category,
    filters.actionType,
    filters.entityType,
    filters.userId,
    filters.startDate?.getTime(),
    filters.endDate?.getTime(),
    filters.searchTerm,
    limit,
  ]);

  return { entries, isLoading, error, refetch: fetchData };
}
