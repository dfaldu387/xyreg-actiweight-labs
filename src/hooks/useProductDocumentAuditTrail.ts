import { useState, useEffect } from 'react';
import { AuditTrailService } from '@/services/auditTrailService';
import type { UnifiedAuditTrailEntry, AuditTrailFilters } from '@/types/auditTrail';

interface UseProductDocumentAuditTrailOptions {
  productId: string;
  companyId: string;
  filters: AuditTrailFilters;
  limit?: number;
}

export function useProductDocumentAuditTrail({
  productId,
  companyId,
  filters,
  limit = 200,
}: UseProductDocumentAuditTrailOptions) {
  const [entries, setEntries] = useState<UnifiedAuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!productId || !companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await AuditTrailService.getProductDocumentAuditTrail(
        productId,
        companyId,
        filters,
        limit
      );

      setEntries(data);
    } catch (err: any) {
      console.error('[useProductDocumentAuditTrail] Error:', err);
      setError(err.message || 'Failed to load document audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    productId,
    companyId,
    filters.userId,
    filters.startDate?.getTime(),
    filters.endDate?.getTime(),
    filters.searchTerm,
    limit,
  ]);

  return { entries, isLoading, error, refetch: fetchData };
}
