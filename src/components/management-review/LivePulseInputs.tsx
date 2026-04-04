import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileWarning, Truck, GraduationCap } from 'lucide-react';
import { KPICard } from '@/components/kpi/KPICard';
import { useCAPAAggregatedStats } from '@/hooks/useCAPAAggregation';
import { useNCAnalytics } from '@/hooks/useNonconformityData';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface LivePulseInputsProps {
  companyId: string | undefined;
  companyName: string;
}

export function LivePulseInputs({ companyId, companyName }: LivePulseInputsProps) {
  const navigate = useNavigate();
  const encodedName = encodeURIComponent(companyName);
  const { lang } = useTranslation();

  // Data hooks
  const { data: capaStats, isLoading: capaLoading } = useCAPAAggregatedStats(companyId);
  const { data: ncAnalytics, isLoading: ncLoading } = useNCAnalytics(companyId);
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(companyId || '');

  // Supplier breakdown
  const supplierTotal = suppliers?.length ?? 0;
  const approvedCount = suppliers?.filter(s => s.status === 'Approved').length ?? 0;
  const probationCount = suppliers?.filter(s => s.status === 'Probationary').length ?? 0;
  const disqualifiedCount = suppliers?.filter(s => s.status === 'Disqualified').length ?? 0;

  const getCapaStatus = () => {
    if (!capaStats) return 'neutral' as const;
    if (capaStats.overdue > 0 || capaStats.byPriority.critical > 0) return 'danger' as const;
    if (capaStats.byPriority.high > 0) return 'warning' as const;
    return 'success' as const;
  };

  const getNcStatus = () => {
    if (!ncAnalytics) return 'neutral' as const;
    if (ncAnalytics.overdue > 0) return 'danger' as const;
    if (ncAnalytics.open > 5) return 'warning' as const;
    return 'success' as const;
  };

  const getSupplierStatus = () => {
    if (disqualifiedCount > 0) return 'danger' as const;
    if (probationCount > 0) return 'warning' as const;
    return 'success' as const;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CAPA Trends */}
      <div
        className="cursor-pointer transition-transform hover:scale-[1.01]"
        onClick={() => navigate(`/app/company/${encodedName}/capa`)}
      >
        <KPICard
          title={lang('managementReview.qualityTrends')}
          value={capaLoading ? '—' : (capaStats?.totalOpen ?? 0)}
          subtitle={capaLoading ? lang('managementReview.loading') : `${capaStats?.overdue ?? 0} ${lang('managementReview.overdue')} · ${capaStats?.escalatedCount ?? 0} ${lang('managementReview.escalated')}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          status={getCapaStatus()}
        >
          {capaStats && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {capaStats.byPriority.critical > 0 && <Badge variant="destructive">{capaStats.byPriority.critical} {lang('managementReview.critical')}</Badge>}
              {capaStats.byPriority.high > 0 && <Badge variant="outline" className="border-warning text-warning">{capaStats.byPriority.high} {lang('managementReview.high')}</Badge>}
              {capaStats.byPriority.medium > 0 && <Badge variant="outline">{capaStats.byPriority.medium} {lang('managementReview.medium')}</Badge>}
              {capaStats.byPriority.low > 0 && <Badge variant="secondary">{capaStats.byPriority.low} {lang('managementReview.low')}</Badge>}
            </div>
          )}
        </KPICard>
      </div>

      {/* NC Overview */}
      <div
        className="cursor-pointer transition-transform hover:scale-[1.01]"
        onClick={() => navigate(`/app/company/${encodedName}/nonconformity`)}
      >
        <KPICard
          title={lang('managementReview.ncOverview')}
          value={ncLoading ? '—' : (ncAnalytics?.open ?? 0)}
          subtitle={ncLoading ? lang('managementReview.loading') : `${ncAnalytics?.total ?? 0} ${lang('managementReview.total')} · ${ncAnalytics?.overdue ?? 0} ${lang('managementReview.overdue')}`}
          icon={<FileWarning className="h-4 w-4" />}
          status={getNcStatus()}
        >
          {ncAnalytics?.byStatus && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {Object.entries(ncAnalytics.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs capitalize">
                  {status}: {count as number}
                </Badge>
              ))}
            </div>
          )}
        </KPICard>
      </div>

      {/* Supplier Health */}
      <div
        className="cursor-pointer transition-transform hover:scale-[1.01]"
        onClick={() => navigate(`/app/company/${encodedName}/suppliers`)}
      >
        <KPICard
          title={lang('managementReview.supplierHealth')}
          value={suppliersLoading ? '—' : supplierTotal}
          subtitle={suppliersLoading ? lang('managementReview.loading') : `${approvedCount} ${lang('managementReview.approved')} · ${probationCount} ${lang('managementReview.probationary')} · ${disqualifiedCount} ${lang('managementReview.disqualified')}`}
          icon={<Truck className="h-4 w-4" />}
          status={getSupplierStatus()}
        />
      </div>

      {/* Training Compliance */}
      <KPICard
        title={lang('managementReview.trainingCompliance')}
        value="—"
        subtitle={lang('managementReview.trainingSubtitle')}
        icon={<GraduationCap className="h-4 w-4" />}
        status="neutral"
        tooltipContent={{
          formula: lang('managementReview.trainingFormula'),
          description: lang('managementReview.trainingDescription'),
        }}
      />
    </div>
  );
}
