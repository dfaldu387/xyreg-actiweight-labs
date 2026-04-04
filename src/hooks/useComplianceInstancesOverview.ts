import { useQuery } from '@tanstack/react-query';

interface ComplianceOverviewData {
  documents: number;
  documentsTotal: number;
  gapAnalysis: number;
  gapAnalysisTotal: number;
  activities: number;
  activitiesTotal: number;
  audits: number;
  auditsTotal: number;
  clinicalTrials: number;
  clinicalTrialsTotal: number;
}

interface UseComplianceInstancesOverviewProps {
  context: 'company' | 'product';
  companyName?: string;
  productId?: string;
}

export function useComplianceInstancesOverview({
  context,
  companyName,
  productId
}: UseComplianceInstancesOverviewProps) {
  return useQuery({
    queryKey: ['compliance-instances-overview', context, companyName, productId],
    queryFn: async (): Promise<ComplianceOverviewData> => {
      // Return realistic but static data for now
      // TODO: Replace with real Supabase queries once database structure is confirmed
      return {
        documents: 172,
        documentsTotal: 172,
        gapAnalysis: 8,
        gapAnalysisTotal: 12,
        activities: 24,
        activitiesTotal: 35,
        audits: 4,
        auditsTotal: 8,
        clinicalTrials: 2,
        clinicalTrialsTotal: 5
      };
    },
    enabled: !!(context && (companyName || productId)),
  });
}