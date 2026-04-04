import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskLevel } from './risk-management/types';

interface RiskOverviewCardProps {
  productId: string;
}

interface HazardRow {
  id: string;
  description: string;
  category?: string;
  initial_severity?: number;
  residual_risk_level?: RiskLevel;
  residual_risk?: RiskLevel;
  mitigation_measure?: string;
  risk_control_measure?: string;
}

const RISK_CATEGORIES = ['Clinical', 'Technical', 'Regulatory', 'Commercial'];

// Infer category from hazard description if not set
function inferCategory(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('regulatory') || lower.includes('approval') || lower.includes('fda') || lower.includes('ce mark')) return 'Regulatory';
  if (lower.includes('clinical') || lower.includes('patient') || lower.includes('harm') || lower.includes('injury')) return 'Clinical';
  if (lower.includes('commercial') || lower.includes('market') || lower.includes('sale') || lower.includes('revenue')) return 'Commercial';
  return 'Technical';
}

// Determine mitigation status from residual risk
function getMitigationStatus(hazard: HazardRow): 'mitigated' | 'in_progress' | 'open' {
  const residualRisk = hazard.residual_risk_level || hazard.residual_risk;
  const hasMitigation = !!(hazard.mitigation_measure || hazard.risk_control_measure);

  if (residualRisk === 'Low' && hasMitigation) return 'mitigated';
  if (hasMitigation) return 'in_progress';
  return 'open';
}

export function RiskOverviewCard({ productId }: RiskOverviewCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['risk-overview', productId],
    queryFn: async () => {
      const { data: hazards, error } = await supabase
        .from('hazards')
        .select('id, description, category, initial_severity, residual_risk_level, residual_risk, mitigation_measure, risk_control_measure')
        .eq('product_id', productId)
        .order('initial_severity', { ascending: false })
        .limit(50);

      if (error) throw error;
      return hazards as HazardRow[];
    },
    enabled: !!productId,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hazards = data || [];
  const totalRisks = hazards.length;

  // Calculate category counts
  const categoryCounts = RISK_CATEGORIES.map(category => {
    const categoryHazards = hazards.filter(h => (h.category || inferCategory(h.description)) === category);
    const mitigated = categoryHazards.filter(h => getMitigationStatus(h) === 'mitigated').length;
    const inProgress = categoryHazards.filter(h => getMitigationStatus(h) === 'in_progress').length;
    const open = categoryHazards.filter(h => getMitigationStatus(h) === 'open').length;

    return {
      category,
      mitigated,
      inProgress,
      open,
      total: categoryHazards.length,
    };
  });

  const mitigatedCount = hazards.filter(h => getMitigationStatus(h) === 'mitigated').length;
  const mitigationRate = totalRisks > 0 ? Math.round((mitigatedCount / totalRisks) * 100) : 0;

  if (totalRisks === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No risks identified yet</p>
              <p className="text-sm">Use the Risk Management module to add hazards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Risk Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {totalRisks} {totalRisks === 1 ? 'Risk' : 'Risks'}
            </Badge>
            <Badge
              variant="secondary"
              className={mitigationRate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                mitigationRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
            >
              {mitigationRate}% Mitigated
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryCounts.map((cat) => (
            <div
              key={cat.category}
              className="p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{cat.category}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {cat.mitigated > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {cat.mitigated}
                  </span>
                )}
                {cat.inProgress > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    {cat.inProgress}
                  </span>
                )}
                {cat.open > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {cat.open}
                  </span>
                )}
                {cat.total === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
