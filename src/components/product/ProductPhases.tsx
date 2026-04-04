
import React from "react";
import { ProductPhase } from "@/types/client";
import { PhaseTimelineManager } from "./timeline/PhaseTimelineManager";
import { useProductPhases } from "@/hooks/useProductPhases";

interface ProductPhasesProps {
  phases: ProductPhase[];
  product?: {
    id: string;
    company_id?: string;
    projected_launch_date?: string;
  };
}

export function ProductPhases({ phases, product }: ProductPhasesProps) {
  const {
    handlePhaseStartDateChange,
    handlePhaseEndDateChange,
    handleSetCurrentPhase,
    handlePhaseStatusChange,
    
  } = useProductPhases(product?.id, product?.company_id, product);

  // Transform phases to match PhaseTimelineManager interface
  const transformedPhases = phases.map(phase => ({
    id: phase.id,
    name: phase.name,
    startDate: phase.start_date ? new Date(phase.start_date) : undefined,
    endDate: phase.end_date ? new Date(phase.end_date) : undefined,
    status: phase.status,
    isCurrentPhase: phase.is_current_phase || phase.isCurrentPhase,
    isOverdue: phase.is_overdue,
    position: phase.position,
    likelihood_of_success: phase.likelihood_of_success || 100,
    typical_start_day: phase.typical_start_day,
    typical_duration_days: phase.typical_duration_days,
    
  }));

  // Calculate overall progress based on phases
  const completedPhases = phases.filter(phase => 
    phase.status === 'Completed'
  ).length;
  const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

  // Get project start date from first phase or earliest phase start date
  const projectStartDate = phases.length > 0 
    ? phases
        .filter(phase => phase.start_date)
        .map(phase => new Date(phase.start_date))
        .sort((a, b) => a.getTime() - b.getTime())[0]
    : undefined;

  return (
    <PhaseTimelineManager
      productId={product?.id}
      companyId={product?.company_id}
      product={product}
      phases={transformedPhases}
      onPhaseStartDateChange={handlePhaseStartDateChange}
      onPhaseEndDateChange={handlePhaseEndDateChange}
      onSetCurrentPhase={handleSetCurrentPhase}
      onPhaseStatusChange={handlePhaseStatusChange}
      
      progress={progress}
      projectStartDate={projectStartDate}
      projectedLaunchDate={product?.projected_launch_date ? new Date(product.projected_launch_date) : undefined}
    />
  );
}
