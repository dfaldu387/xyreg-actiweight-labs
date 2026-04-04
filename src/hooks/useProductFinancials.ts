import { useQuery } from '@tanstack/react-query';

interface ProductFinancials {
  burnRate: number;
  runwayMonths: number;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
}

export function useProductFinancials(productId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['product-financials', productId, companyId],
    queryFn: async (): Promise<ProductFinancials> => {
      // Mock data for now - actual budget tables may not exist
      // In future, fetch from budget_dashboard/budget_items tables
      return {
        burnRate: 45000,
        runwayMonths: 14,
        totalBudget: 1200000,
        totalSpent: 570000,
        remainingBudget: 630000
      };
    },
    enabled: !!productId && !!companyId,
    staleTime: 60000
  });
}
