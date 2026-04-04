import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircularProgressRing } from '@/components/common/CircularProgressRing';
import { MiniSparkline } from '@/components/common/MiniSparkline';
import { useProductPhases } from '@/hooks/useProductPhases';
import { usePhaseCIData } from '@/hooks/usePhaseCIData';
import { useDeviceDashboardMetrics } from '@/hooks/useDeviceDashboardMetrics';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/client';
import { Calendar, Target, AlertTriangle, TrendingUp } from "lucide-react";
import { FinancialHealthCard } from './FinancialHealthCard';
import { ClinicalProgressCard } from './ClinicalProgressCard';
import { RegulatoryTrafficLightCard } from './RegulatoryTrafficLightCard';
import { RNPVCard } from './RNPVCard';
import { useTranslation } from '@/hooks/useTranslation';

export interface InvestorViewSettings {
  show_phases?: boolean;
  show_completion?: boolean;
  show_days_to_finish?: boolean;
  show_overdue?: boolean;
  show_burn_rate?: boolean;
  show_clinical_enrollment?: boolean;
  show_regulatory_status_map?: boolean;
  show_rnpv?: boolean;
}

interface DeviceStatusSummaryCardsProps {
  product: Product;
  productId: string;
  companyId: string;
  mode?: 'company' | 'investor';
  shareSettings?: InvestorViewSettings;
  isProductLoading?: boolean;
  compact?: boolean;
}

export function DeviceStatusSummaryCards({
  product,
  productId,
  companyId,
  mode = 'company',
  shareSettings,
  isProductLoading,
  compact = false
}: DeviceStatusSummaryCardsProps) {
  const { lang } = useTranslation();
  const isInvestorMode = mode === 'investor';
  
  // Helper to check if a card should be visible
  const shouldShowCard = (cardKey: keyof InvestorViewSettings, defaultValue = true) => {
    if (!isInvestorMode) return true;
    return shareSettings?.[cardKey] ?? defaultValue;
  };
  // Get phase-based progress
  const { phases } = useProductPhases(productId, companyId, product);
  
  // Calculate phase-based progress - include ALL phases in calculation
  const totalPhases = phases?.length || 0;
  const completedPhases = phases?.filter(phase => phase.status === 'Completed').length || 0;
  
  // Normal percentage calculation: completed/total
  const phaseProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
  
  // Debug logging
  // console.log('[DeviceStatus] Phases data:', phases);
  // console.log('[DeviceStatus] Progress calculation:', { completedPhases, totalPhases, phaseProgress });

  // Get current phase ID from phase name
  const currentPhaseName = product?.current_lifecycle_phase || '';
  const [currentPhaseId, setCurrentPhaseId] = React.useState<string>('');
  
  React.useEffect(() => {
    const fetchPhaseId = async () => {
      if (!currentPhaseName || !companyId) return;
      
      const { data } = await supabase
        .from('phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', currentPhaseName)
        .maybeSingle();
      
      if (data) {
        setCurrentPhaseId(data.id);
      }
    };
    
    fetchPhaseId();
  }, [currentPhaseName, companyId]);

  // Fetch current phase CI data
  const { data: phaseData, isLoading } = usePhaseCIData(
    currentPhaseId, 
    productId, 
    companyId
  );

  // Calculate total overdue items
  const totalOverdue = phaseData.documents.overdue + phaseData.gapAnalysis.overdue;

  const isLaunched = !!product?.actual_launch_date;

  // Get dashboard metrics
  const metrics = useDeviceDashboardMetrics(
    product,
    totalPhases,
    completedPhases,
    totalOverdue
  );

  return (
    <div className="space-y-3">
      {/* Primary KPIs - Always shown in company mode, conditionally in investor mode */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Phases */}
        {shouldShowCard('show_phases') && (
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white shadow-lg">
            <CardContent className={compact ? "p-2 space-y-1" : "p-3 space-y-1.5"}>
              <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
                <span>{lang('deviceStatus.totalPhases')}</span>
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className={compact ? "text-xl font-bold leading-tight" : "text-2xl font-bold leading-tight"}>{metrics.totalPhases}</p>
                <p className="text-xs text-white/80">{lang('deviceStatus.lifecycleCheckpoints')}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-white/80">
                <div className="h-1 w-6 rounded-full bg-white/30" />
                <span>{isLaunched ? lang('deviceStatus.allCompleted') || 'All completed' : `${completedPhases} ${lang('deviceStatus.completed')}`}</span>
              </div>
              <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 blur-3xl" />
            </CardContent>
          </Card>
        )}

        {/* Completion */}
        {shouldShowCard('show_completion') && (
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg">
            <CardContent className={compact ? "p-2 flex flex-col items-center text-center space-y-1" : "p-3 flex flex-col items-center text-center space-y-1"}>
              <div className="flex items-center gap-2 text-white/90 text-[10px] uppercase tracking-[0.3em]">
                <Target className="h-3 w-3" />
                <span>{lang('deviceStatus.completion')}</span>
              </div>
              <div className="relative inline-flex items-center justify-center">
                <CircularProgressRing
                  value={metrics.completedPercentage}
                  size={compact ? 50 : 60}
                  strokeWidth={5}
                  color="white"
                  backgroundColor="rgba(255,255,255,0.25)"
                />
                <div className={compact ? "absolute text-sm font-bold" : "absolute text-lg font-bold"}>
                  {metrics.completedPercentage}%
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-[9px]">
                {phaseProgress}% {lang('deviceStatus.phaseAlignment')}
              </Badge>
              <p className="text-[10px] text-white/80">
                {isLaunched 
                  ? (lang('deviceStatus.allDevPhasesCompleted') || 'All development phases completed')
                  : lang('deviceStatus.phasesApproved').replace('{{completed}}', String(completedPhases)).replace('{{total}}', String(totalPhases))}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Days to Finish */}
        {shouldShowCard('show_days_to_finish') && (
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-lg">
            <CardContent className={compact ? "p-2 space-y-1" : "p-3 space-y-1"}>
              <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
                <span>{lang('deviceStatus.daysToFinish')}</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2">
                <p className={compact ? "text-xl font-bold leading-none" : "text-2xl font-bold leading-none"}>{metrics.daysToFinish}</p>
                <span className="text-xs text-white/80 mb-0.5">{isLaunched ? (lang('deviceStatus.launched') || 'Launched') : lang('deviceStatus.projected')}</span>
              </div>
              {!compact && (
                <div className="rounded-lg bg-white/10 px-2 py-1">
                  <MiniSparkline data={metrics.sparklineData} color="white" height={20} />
                </div>
              )}
              <p className="text-[9px] uppercase tracking-wider text-white/70">
                {lang('deviceStatus.updated').replace('{{date}}', new Date().toLocaleDateString())}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overdue */}
        {shouldShowCard('show_overdue') && (
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white shadow-lg">
            <CardContent className={compact ? "p-2 space-y-1" : "p-3 space-y-1"}>
              <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
                <span>{lang('deviceStatus.itemsOverdue')}</span>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2">
                <p className={compact ? "text-xl font-bold leading-none" : "text-2xl font-bold leading-none"}>{metrics.daysOverdue}</p>
                <span className="text-xs text-white/80 mb-0.5">{lang('deviceStatus.requiresAction')}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Extended KPIs - Financial, Clinical, Regulatory, rNPV */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Financial Health */}
        {shouldShowCard('show_burn_rate') && (
          <FinancialHealthCard productId={productId} companyId={companyId} />
        )}

        {/* Clinical Progress */}
        {shouldShowCard('show_clinical_enrollment') && (
          <ClinicalProgressCard productId={productId} companyId={companyId} />
        )}

        {/* Regulatory Traffic Light */}
        {shouldShowCard('show_regulatory_status_map') && (
          <RegulatoryTrafficLightCard productId={productId} markets={product?.markets} isParentLoading={isProductLoading} />
        )}

        {/* rNPV Valuation */}
        {shouldShowCard('show_rnpv') && (
          <RNPVCard productId={productId} />
        )}
      </div>
    </div>
  );
}