import React from 'react';
import PricingModule from '@/new-price/PricingModule';
import { SelectedPlan } from '@/hooks/useRegistrationFlow';

interface PricingStepProps {
  onPlanSelect: (plan: SelectedPlan) => void;
  selectedPlan?: SelectedPlan;
}

export function PricingStep({ onPlanSelect, selectedPlan }: PricingStepProps) {
  return (
    <PricingModule
      isRegistrationFlow={true}
      onPlanSelect={onPlanSelect}
      initialSelectedPlan={selectedPlan}
    />
  );
}
