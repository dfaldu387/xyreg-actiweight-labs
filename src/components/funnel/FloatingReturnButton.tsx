import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Crosshair, ArrowRight, ArrowLeft, Map, CheckCircle, ClipboardCheck, GitBranch, FileCheck } from 'lucide-react';
import { useViabilityFunnelProgress } from '@/hooks/useViabilityFunnelProgress';
import { supabase } from '@/integrations/supabase/client';
import { ALL_DEVELOPMENT_STEPS } from '@/components/product/business-case/blueprintStepMapping';
import { ANNEX_II_SECTIONS } from '@/config/gapAnnexIISections';
import { findBestMatchingStepIndex } from '@/utils/stepRouteMatching';

// Build step list from blueprintStepMapping for Venture Blueprint navigation
interface StepNavItem {
  label: string;
  route: string;
  complete: boolean;
}

function buildVentureBlueprintStepList(productId: string): StepNavItem[] {
  return ALL_DEVELOPMENT_STEPS.map((step, index) => ({
    label: `${step.stepNumber}. ${step.title}`,
    route: `/app/product/${productId}/${step.route}`,
    complete: false,
  }));
}

function buildGapAnalysisStepList(productId: string): StepNavItem[] {
  const steps: StepNavItem[] = [];
  for (const section of ANNEX_II_SECTIONS) {
    const baseRoute = `/app/product/${productId}/gap-analysis`;

    if (section.subItems && section.subItems.length > 0) {
      // Each sub-item becomes its own step
      for (const sub of section.subItems) {
        steps.push({
          label: `${section.section}.${sub.letter} ${sub.description}`,
          route: baseRoute,
          complete: false,
        });
      }
    } else {
      // Section without sub-items is a single step
      steps.push({
        label: `${section.section} ${section.title}`,
        route: baseRoute,
        complete: false,
      });
    }
  }
  return steps;
}

// Simple return button destinations (non-step-based flows)
interface SimpleReturnConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Universal floating navigation bar that appears when navigating from Venture Blueprint, XyReg Genesis,
 * or simple return flows like Usability Engineering.
 * Shows Previous/Next step navigation with current step indicator and progress percentage for step-based flows,
 * or a simple return button for non-step-based flows.
 */
export function FloatingReturnButton() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { productId: routeProductId } = useParams<{ productId: string }>();

  const returnTo = searchParams.get('returnTo');
  
  // Get productId from route params OR query params (for settings pages)
  const productId = routeProductId || searchParams.get('productId');

  // Get company_id from product for the progress hook
  const { data: productData } = useQuery({
    queryKey: ['floating-button-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const companyId = productData?.company_id || '';

  // Get progress and checklist (used for Genesis flow)
  const { readinessChecklist, overallProgress, isLoading } = useViabilityFunnelProgress(
    productId || '',
    companyId
  );

  const isVentureBlueprint = returnTo === 'venture-blueprint';
  const isGenesis = returnTo === 'genesis' || returnTo === 'investor-share';
  const isGapAnalysis = returnTo === 'gap-analysis';
  const isUsabilityEngineering = returnTo === 'usability-engineering';
  const isUsabilityHazards = returnTo === 'usability-hazards';
  const isRegulatory = returnTo === 'regulatory';
  const isRegulatoryDNA = returnTo === 'regulatory-dna';
  const isOverview = returnTo === 'overview';
  const isDeviceOverview = returnTo === 'device-overview';
  const isUserNeeds = returnTo === 'user-needs';
  const isSystemRequirements = returnTo === 'system-requirements';
  const isSoftwareRequirements = returnTo === 'software-requirements';
  const isHardwareRequirements = returnTo === 'hardware-requirements';
  const isMatrix = returnTo === 'matrix';
  const isDesignReview = returnTo === 'design-review';
  const isVariantDevice = returnTo === 'variant-device';
  const isVariants = returnTo === 'variants';

  // Simple return configs for non-step-based flows
  const simpleReturnConfigs: Record<string, SimpleReturnConfig> = {
    'usability-engineering': {
      path: `/app/product/${productId}/design-risk-controls?tab=usability-engineering`,
      label: 'Return to Usability Engineering',
      icon: <ClipboardCheck className="h-4 w-4" />
    },
    'usability-hazards': {
      path: `/app/product/${productId}/design-risk-controls?tab=usability-engineering&subTab=usability-hazards`,
      label: 'Return to Usability Hazards',
      icon: <ClipboardCheck className="h-4 w-4" />
    },
    'regulatory': {
      path: `/app/product/${productId}/device-information?tab=regulatory`,
      label: 'Return to Regulatory',
      icon: <ClipboardCheck className="h-4 w-4" />
    },
    'regulatory-dna': {
      path: `/app/product/${productId}/device-information?tab=markets-regulatory&subtab=ai-suggestions`,
      label: 'Return to AI & DNA',
      icon: <GitBranch className="h-4 w-4" />
    },
    'overview': {
      path: `/app/product/${productId}/device-information?tab=overview`,
      label: 'Return to Overview',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'device-overview': {
      path: `/app/product/${productId}/device-information?tab=overview`,
      label: 'Return to Device Overview',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'business-case': {
      path: `/app/product/${productId}/business-case?tab=rnpv`,
      label: 'Return to Business Case',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'viability-scorecard': {
      path: `/app/product/${productId}/business-case?tab=genesis&openScorecard=true`,
      label: 'Return to Viability Scorecard',
      icon: <ClipboardCheck className="h-4 w-4" />
    },
    'user-needs': {
      path: `/app/product/${productId}/design-risk-controls?tab=requirement-specifications&subTab=user-needs`,
      label: 'Return to User Needs',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'system-requirements': {
      path: `/app/product/${productId}/design-risk-controls?tab=requirement-specifications&subTab=system-requirements`,
      label: 'Return to System Requirements',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'software-requirements': {
      path: `/app/product/${productId}/design-risk-controls?tab=requirement-specifications&subTab=software-requirements`,
      label: 'Return to Software Requirements',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'hardware-requirements': {
      path: `/app/product/${productId}/design-risk-controls?tab=requirement-specifications&subTab=hardware-requirements`,
      label: 'Return to Hardware Requirements',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    'matrix': {
      path: `/app/product/${productId}/design-risk-controls?tab=traceability&subTab=matrix`,
      label: 'Return to Traceability Matrix',
      icon: <ArrowLeft className="h-4 w-4" />
    },
    ...(returnTo === 'design-review' ? {
      'design-review': {
        path: `/app/product/${productId}/design-review/${searchParams.get('drId') || ''}`,
        label: 'Return to Design Review',
        icon: <ClipboardCheck className="h-4 w-4" />
      }
    } : {}),
    ...(returnTo === 'variant-device' ? {
      'variant-device': {
        path: searchParams.get('variantReturnPath') || `/app/product/${productId}/device-information`,
        label: 'Return to Variant',
        icon: <ArrowLeft className="h-4 w-4" />
      }
    } : {}),
    'variants': {
      path: `/app/product/${productId}/device-information?tab=variants`,
      label: 'Return to Variants',
      icon: <GitBranch className="h-4 w-4" />
    },
  };

  // Build step list for Venture Blueprint from blueprintStepMapping
  const ventureBlueprintSteps = useMemo(() => {
    if (!productId) return [];
    return buildVentureBlueprintStepList(productId);
  }, [productId]);

  // Build step list for Gap Analysis from ANNEX_II_SECTIONS
  const gapAnalysisSteps = useMemo(() => {
    if (!productId) return [];
    return buildGapAnalysisStepList(productId);
  }, [productId]);

  // Use the appropriate step list based on flow type
  const stepList = isGapAnalysis ? gapAnalysisSteps : isVentureBlueprint ? ventureBlueprintSteps : readinessChecklist;

  // Only show for known return destinations
  if (!returnTo || !productId) {
    return null;
  }

  const isBusinessCase = returnTo === 'business-case';
  const isViabilityScorecard = returnTo === 'viability-scorecard';

  // Handle simple return flows (non-step-based)
  if (isUsabilityEngineering || isUsabilityHazards || isRegulatory || isRegulatoryDNA || isOverview || isDeviceOverview || isBusinessCase || isViabilityScorecard || isUserNeeds || isSystemRequirements || isSoftwareRequirements || isHardwareRequirements || isMatrix || isDesignReview || isVariantDevice || isVariants) {
    const config = simpleReturnConfigs[returnTo];
    if (!config) return null;

    const handleReturn = () => {
      navigate(config.path);
    };

    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <Button
          onClick={handleReturn}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 gap-2 pr-4 pl-3 py-2 h-auto rounded-full"
        >
          <div className="bg-primary-foreground/20 rounded-full p-1">
            {config.icon}
          </div>
          <span className="font-medium">{config.label}</span>
          <ArrowLeft className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }
  
  if (!isVentureBlueprint && !isGenesis && !isGapAnalysis) {
    return null;
  }

  // Get current path for matching
  const currentPathBase = location.pathname;

  // Resolve current step by best (most specific) route match
  const currentStepIndex = findBestMatchingStepIndex(stepList, currentPathBase, searchParams);

  // Sequential navigation
  const nextStepIndex = currentStepIndex >= 0 && currentStepIndex + 1 < stepList.length
    ? currentStepIndex + 1
    : -1;
  const previousStepIndex = currentStepIndex > 0 ? currentStepIndex - 1 : -1;

  const totalSteps = stepList.length;

  // Use 1-based index for step number display
  const currentStepDisplay = String(currentStepIndex + 1);

  const handleNext = () => {
    if (nextStepIndex < 0) {
      // Return to home when on last step
      if (isGapAnalysis) {
        navigate(`/app/product/${productId}/gap-analysis`);
      } else if (isVentureBlueprint) {
        navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`);
      } else {
        navigate(`/app/product/${productId}/business-case?tab=genesis`);
      }
    } else {
      // Navigate to next step, preserving returnTo
      const nextRoute = stepList[nextStepIndex].route;
      const separator = nextRoute.includes('?') ? '&' : '?';
      navigate(`${nextRoute}${separator}returnTo=${returnTo}`);
    }
  };

  const handlePrevious = () => {
    if (previousStepIndex >= 0) {
      const prevRoute = stepList[previousStepIndex].route;
      const separator = prevRoute.includes('?') ? '&' : '?';
      navigate(`${prevRoute}${separator}returnTo=${returnTo}`);
    }
  };

  // Extract short label from full label (remove ✓/❌ prefix and details in parentheses)
  const getShortLabel = (label: string): string => {
    let shortLabel = label.replace(/^[✓❌]\s*/, '');
    shortLabel = shortLabel.split(/[:(]/)[0].trim();
    return shortLabel;
  };

  // Only show "Return to Genesis/Blueprint" when on the last step (no next step)
  const isLastStep = nextStepIndex < 0;
  const nextLabel = isLastStep
    ? (isGapAnalysis ? 'Return to Gap Analysis' : isVentureBlueprint ? 'Return to Blueprint' : 'Return to Genesis')
    : `${getShortLabel(stepList[nextStepIndex].label)}`;

  const prevLabel = previousStepIndex >= 0
    ? getShortLabel(stepList[previousStepIndex].label)
    : null;

  const Icon = isGapAnalysis ? FileCheck : isVentureBlueprint ? Map : Crosshair;

  // Color scheme: white buttons with dark text
  const buttonStyle = '!bg-slate-100 hover:!bg-slate-200 text-slate-700 border border-slate-500 shadow-sm';
  const completedButtonStyle = '!bg-emerald-50 hover:!bg-emerald-100 text-emerald-700 border border-emerald-400 shadow-sm';

  // Completion status for adjacent steps
  const prevComplete = previousStepIndex >= 0 ? stepList[previousStepIndex].complete : false;
  const nextComplete = nextStepIndex >= 0 ? stepList[nextStepIndex].complete : false;
  const currentComplete = currentStepIndex >= 0 ? stepList[currentStepIndex].complete : false;

  if (isLoading || !companyId) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-[28px] border shadow-xl px-3 py-1.5">
        {/* Previous Button - Fixed width */}
        {prevLabel && (
          <Button
            onClick={handlePrevious}
            size="sm"
            className={`
              gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-start
              ${prevComplete ? completedButtonStyle : buttonStyle}
            `}
          >
            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${prevComplete ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <span className="text-xs font-medium truncate flex-1 text-left">{prevLabel}</span>
          </Button>
        )}

        {/* Step Counter - Orange/Amber center section */}
        <div className="flex flex-col items-center px-6 py-2 min-w-[220px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-2">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Icon className="h-4 w-4" />
            Step {currentStepDisplay} of {totalSteps}
            {currentComplete && <CheckCircle className="h-4 w-4 text-emerald-300" />}
          </span>
          <span className="text-xs text-amber-100 truncate max-w-[200px]">
            {currentStepIndex >= 0 ? getShortLabel(stepList[currentStepIndex].label) : 'Unknown'} • {overallProgress}%
          </span>
        </div>

        {/* Next Button - Fixed width, same as Previous */}
        <Button
          onClick={handleNext}
          size="sm"
          className={`
            gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-end
            ${isLastStep ? completedButtonStyle : (nextComplete ? completedButtonStyle : buttonStyle)} rounded-full justify-end
          `}
        >
          <span className="text-xs font-medium truncate flex-1 text-right">{nextLabel}</span>
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${nextComplete || isLastStep ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
}
