import { useQuery } from '@tanstack/react-query';
import { fetchGovernanceStatuses, FieldGovernanceRecord } from '@/services/fieldGovernanceService';

export function useFieldGovernance(productId: string | undefined) {
  const query = useQuery({
    queryKey: ['field-governance', productId],
    queryFn: () => fetchGovernanceStatuses(productId!),
    enabled: !!productId,
    staleTime: 30000,
  });

  const getSection = (sectionKey: string): FieldGovernanceRecord | undefined => {
    return query.data?.find(r => r.section_key === sectionKey);
  };

  return {
    records: query.data || [],
    isLoading: query.isLoading,
    getSection,
    refetch: query.refetch,
  };
}
