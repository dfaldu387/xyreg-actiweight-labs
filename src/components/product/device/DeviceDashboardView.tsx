import React from 'react';
import { Product } from '@/types/client';
import { DeviceOverviewHeader } from './status/DeviceOverviewHeader';
import { DeviceStatusSummaryCards } from './status/DeviceStatusSummaryCards';
import { PhaseTimelineVisualizer } from './PhaseTimelineVisualizer';
import { DashboardWidgets } from './DashboardWidgets';
import { DeviceHelixMap } from '@/components/qmsr/DeviceHelixMap';
import { useProductPhases } from '@/hooks/useProductPhases';
import { usePhaseCIData } from '@/hooks/usePhaseCIData';
import { supabase } from '@/integrations/supabase/client';

interface DeviceDashboardViewProps {
  product: Product;
  productId: string;
  companyId: string;
}

export function DeviceDashboardView({ product, productId, companyId }: DeviceDashboardViewProps) {
  const { phases } = useProductPhases(productId, companyId, product);
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

  const { data: phaseData, isLoading } = usePhaseCIData(currentPhaseId, productId, companyId);

  return (
    <div className="space-y-4 p-6">
      {/* Device Overview Header */}
      <DeviceOverviewHeader product={product} currentPhase={currentPhaseName} />

      {/* Hero Stats - 4 vibrant cards (compact) */}
      <DeviceStatusSummaryCards 
        product={product}
        productId={productId}
        companyId={companyId}
        compact
      />

      {/* Device Process Engine - Rungs 2-4 (Device-specific) */}
      <DeviceHelixMap 
        productId={productId}
        productName={product?.name}
        companyId={companyId}
      />

      {/* Lifecycle Timeline */}
      <PhaseTimelineVisualizer 
        phases={phases || []}
        currentPhase={currentPhaseName}
        productId={productId}
      />

      {/* Dashboard Widgets */}
      <DashboardWidgets 
        phaseData={phaseData}
        phases={phases || []}
      />
    </div>
  );
}
