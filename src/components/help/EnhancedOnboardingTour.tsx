import React from 'react';
import { OnboardingTour } from './OnboardingTour';
import { OnboardingWizard } from './OnboardingWizard';
import { ProgressTracker } from './ProgressTracker';
import { useOnboarding } from '@/hooks/useOnboarding';

interface EnhancedOnboardingTourProps {
  className?: string;
  // Legacy props for backward compatibility
  isActive?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function EnhancedOnboardingTour({ 
  className,
  isActive,
  onComplete,
  onSkip
}: EnhancedOnboardingTourProps) {
  const {
    // Legacy tour
    showTour,
    completeTour,
    skipTour,
    
    // Enhanced wizard
    showOnboardingWizard,
    showProgressTracker,
    currentStage,
    stages,
    completionPercentage,
    completeStep,
    skipStep,
    completeStage,
    completeOnboarding,
    hideProgressTracker
  } = useOnboarding();

  // Handle legacy props if provided
  const shouldShowTour = isActive !== undefined ? isActive : showTour;
  const handleComplete = onComplete || completeTour;
  const handleSkip = onSkip || skipTour;

  return (
    <>
      {/* Legacy onboarding tour for existing users */}
      {shouldShowTour && (
        <OnboardingTour
          isActive={shouldShowTour}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {/* Enhanced onboarding wizard for new comprehensive experience */}
      {showOnboardingWizard && (
        <OnboardingWizard
          isOpen={showOnboardingWizard}
          onClose={completeOnboarding}
          stages={stages}
          currentStage={currentStage}
          completionPercentage={completionPercentage}
          onCompleteStep={completeStep}
          onSkipStep={skipStep}
          onCompleteStage={completeStage}
          onCompleteOnboarding={completeOnboarding}
        />
      )}

      {/* Progress tracker for sidebar or dashboard display */}
      {showProgressTracker && completionPercentage > 0 && completionPercentage < 100 && (
        <ProgressTracker
          stages={stages}
          completionPercentage={completionPercentage}
          currentStage={currentStage}
          className={className}
          onClose={hideProgressTracker}
        />
      )}
    </>
  );
}