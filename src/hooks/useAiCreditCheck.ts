import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useQuery } from '@tanstack/react-query';

interface CreditStatus {
  used: number;
  limit: number;
  remaining: number;
  hasCredits: boolean;
}

export function useAiCreditCheck() {
  const { activeCompanyRole } = useCompanyRole();
  const companyId = activeCompanyRole?.companyId;

  const { data: creditStatus, refetch } = useQuery({
    queryKey: ['ai-credit-check', companyId],
    queryFn: async (): Promise<CreditStatus> => {
      if (!companyId) return { used: 0, limit: 0, remaining: 0, hasCredits: true };

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data: usageRows } = await supabase
        .from('ai_token_usage')
        .select('id')
        .eq('company_id', companyId)
        .gte('created_at', firstOfMonth.toISOString());

      const used = (usageRows || []).length;

      const { data: companyPlan } = await supabase
        .from('new_pricing_company_plans')
        .select(`ai_booster_packs, plan:new_pricing_plans(included_ai_credits)`)
        .eq('company_id', companyId)
        .in('status', ['active', 'trial', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let limit = 0;
      if (companyPlan) {
        const plan = companyPlan.plan as any;
        limit = plan?.included_ai_credits || 0;
        limit += companyPlan.ai_booster_packs || 0;
      }

      if (limit === 0) return { used, limit, remaining: 0, hasCredits: true };

      const remaining = Math.max(0, limit - used);
      return { used, limit, remaining, hasCredits: remaining > 0 };
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const checkCredits = useCallback((): boolean => {
    return creditStatus?.hasCredits ?? true;
  }, [creditStatus]);

  return {
    creditStatus: creditStatus ?? { used: 0, limit: 0, remaining: 0, hasCredits: true },
    checkCredits,
    refetchCredits: refetch,
  };
}
