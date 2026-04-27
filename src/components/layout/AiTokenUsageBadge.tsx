import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

interface AiTokenUsageBadgeProps {
  companyId: string;
}

// Credit limits per plan (1 credit = 1 API call)
const PLAN_CREDIT_LIMITS: Record<string, number> = {
  genesis: 0,
  core: 500,
  helix: 500,
  enterprise: 999,
  investor: 0,
};

export function AiTokenUsageBadge({ companyId }: AiTokenUsageBadgeProps) {
  const { data } = useQuery({
    queryKey: ['ai-credit-usage-summary', companyId],
    queryFn: async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch API calls this month (1 credit = 1 API call)
      const { data: rows, error } = await supabase
        .from('ai_token_usage')
        .select('id')
        .eq('company_id', companyId)
        .gte('created_at', firstOfMonth.toISOString());

      if (error) throw error;

      const usedCredits = (rows || []).length;

      // Fetch company plan name to determine credit limit
      let planLimit = 999; // default fallback
      const { data: companyPlan } = await supabase
        .from('new_pricing_company_plans')
        .select(`
          ai_booster_packs,
          plan:new_pricing_plans(name)
        `)
        .eq('company_id', companyId)
        .in('status', ['active', 'trial', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyPlan) {
        const plan = companyPlan.plan as any;
        const planName = (plan?.name || '').toLowerCase();
        planLimit = PLAN_CREDIT_LIMITS[planName] ?? 999;
        // Add booster packs (each pack = 1000 credits)
        const boosters = companyPlan.ai_booster_packs || 0;
        planLimit += boosters * 1000;
      }

      return { usedCredits, planLimit };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });

  if (!data || data.usedCredits === 0) return null;

  const pct = data.planLimit > 0 ? Math.min((data.usedCredits / data.planLimit) * 100, 100) : 0;

  return (
    <div className="mx-2 mb-1 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200 dark:border-violet-800 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Credits</span>
        <span className="text-[10px] text-violet-500 dark:text-violet-400 ml-auto">{data.usedCredits} / {data.planLimit}</span>
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-violet-900 dark:text-violet-100">{data.usedCredits} credits</span>
        <span className="text-[10px] text-violet-500 dark:text-violet-400">this month</span>
      </div>
      <div className="h-1.5 rounded-full bg-violet-200 dark:bg-violet-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
