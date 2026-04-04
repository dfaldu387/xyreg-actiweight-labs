import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, X, Rocket, Star, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOnboardingTour } from '@/context/OnboardingTourContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useMissionControl } from '@/context/MissionControlContext';
import { useTranslation } from '@/hooks/useTranslation';

interface OnboardingItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  stageId: string;
  stepId: string;
}

interface TodoistStyleOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// Helper to extract company name from URL path
const extractCompanyFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/app\/company\/([^/]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
};

// Route configuration for each onboarding step (same as in OnboardingTourContext)
// All step IDs defined here have corresponding tour configurations in OnboardingTourContext
// When a user clicks an onboarding item, it will:
// 1. Navigate to the appropriate route (if needed)
// 2. Start the interactive tour for that step
// 3. Mark the step as complete when the tour finishes
const getStepRoute = (stepId: string, companyName: string): string | null => {
  const encodedCompany = encodeURIComponent(companyName);

  const routeConfigs: Record<string, string> = {
    'profile-setup': `/app/company/${encodedCompany}/settings?tab=profile`,
    'navigation-basics': `/app/company/${encodedCompany}`,
    'help-system': `/app/company/${encodedCompany}`,
    'company-profile': `/app/company/${encodedCompany}`,
    'phases-setup': `/app/company/${encodedCompany}/settings?tab=lifecycle-phases`,
    'templates-setup': `/app/company/${encodedCompany}/settings?tab=templates`,
    'compliance-frameworks': `/app/company/${encodedCompany}/settings?tab=compliance`,
    'first-product': `/app/company/${encodedCompany}/portfolio`,
    'product-classification': `/app/company/${encodedCompany}/portfolio`,
    'milestones-intro': `/app/company/${encodedCompany}/portfolio`,
    'first-document': `/app/company/${encodedCompany}/documents`,
    'template-usage': `/app/company/${encodedCompany}/documents`,
    'version-control': `/app/company/${encodedCompany}/documents`,
    'gap-analysis': `/app/company/${encodedCompany}/gap-analysis`,
    'audit-management': `/app/company/${encodedCompany}/audits`,
    'business-analysis': `/app/company/${encodedCompany}/commercial?tab=business-canvas`,

  };

  return routeConfigs[stepId] || null;
};

export function TodoistStyleOnboarding({
  isOpen,
  onClose,
  onComplete
}: TodoistStyleOnboardingProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyName: paramCompanyName } = useParams<{ companyName: string }>();
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { selectedCompanyName } = useMissionControl();
  const { stages, completeOnboarding, completeStep } = useOnboarding();
  const { startTour, activeTourStepId, activeTourStageId } = useOnboardingTour();
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [localCompletedItems, setLocalCompletedItems] = useState<Set<string>>(new Set());
  const [uncheckedItems, setUncheckedItems] = useState<Set<string>>(new Set());
  const prevActiveTourStepIdRef = useRef<string | null>(null);
  const prevActiveTourStageIdRef = useRef<string | null>(null);

  // Get company name from multiple sources (same logic as OnboardingTourContext)
  const getCompanyName = useCallback((): string | null => {
    // 1. Try URL params first
    if (paramCompanyName) {
      return decodeURIComponent(paramCompanyName);
    }
    // 2. Try extracting from current URL path
    const pathCompany = extractCompanyFromPath(location.pathname);
    if (pathCompany) {
      return pathCompany;
    }
    // 3. Try active company role
    if (activeCompanyRole) {
      return activeCompanyRole.companyName;
    }
    // 4. Try MissionControl context
    if (selectedCompanyName) {
      return selectedCompanyName;
    }
    // 5. Try first available company role
    if (companyRoles.length > 0) {
      return companyRoles[0].companyName;
    }
    return null;
  }, [paramCompanyName, location.pathname, activeCompanyRole, selectedCompanyName, companyRoles]);

  // Get company name for route validation
  const companyName = getCompanyName();

  // Helper function to get translated step title
  const getTranslatedStepTitle = (stepId: string, fallbackTitle: string): string => {
    const translated = lang(`todoistOnboarding.steps.${stepId}`);
    return translated && !translated.includes('todoistOnboarding.steps.') ? translated : fallbackTitle;
  };

  // Convert stages and steps into flat list of items with local completion state
  // Show ALL items regardless of route validity - route validation is only used for navigation
  const onboardingItems = useMemo<OnboardingItem[]>(() => {
    return stages.flatMap(stage =>
      stage.steps.map(step => {
        const itemId = `${stage.id}-${step.id}`;
        // If item is explicitly unchecked, it's not completed
        // Otherwise, use local state OR persisted state for completion status
        const isUnchecked = uncheckedItems.has(itemId);
        const isCompleted = !isUnchecked && (step.completed || localCompletedItems.has(itemId));
        
        return {
          id: itemId,
          title: step.title,
          description: step.description,
          completed: isCompleted,
          stageId: stage.id,
          stepId: step.id
        };
      })
    );
  }, [stages, localCompletedItems, uncheckedItems]);

  // Sync local completed items with stages on mount and when stages change
  useEffect(() => {
    const completedFromStages = new Set<string>();
    stages.forEach(stage => {
      stage.steps.forEach(step => {
        if (step.completed) {
          completedFromStages.add(`${stage.id}-${step.id}`);
        }
      });
    });
    setLocalCompletedItems(completedFromStages);
  }, [stages]);

  // Initialize focused item to first incomplete item
  useEffect(() => {
    if (isOpen) {
      const firstIncomplete = onboardingItems.find(item => !item.completed);
      setFocusedItemId(firstIncomplete?.id || null);
    }
  }, [isOpen, onboardingItems]);

  // Detect when a tour completes and update UI immediately
  useEffect(() => {
    // Check if a tour just completed (activeTourStepId was set but is now null)
    const tourJustCompleted = prevActiveTourStepIdRef.current !== null && activeTourStepId === null;

    if (tourJustCompleted && prevActiveTourStepIdRef.current && prevActiveTourStageIdRef.current) {
      const completedItemId = `${prevActiveTourStageIdRef.current}-${prevActiveTourStepIdRef.current}`;

      // Immediately update local state to show completion
      setLocalCompletedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(completedItemId);
        return newSet;
      });
      
      // Remove from unchecked items if it was previously unchecked
      setUncheckedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(completedItemId);
        return newSet;
      });

      // Update focused item to next incomplete
      setTimeout(() => {
        const nextIncomplete = onboardingItems.find(item =>
          !item.completed && item.id !== completedItemId
        );
        setFocusedItemId(nextIncomplete?.id || null);
      }, 100);
    }

    // Update refs
    prevActiveTourStepIdRef.current = activeTourStepId;
    prevActiveTourStageIdRef.current = activeTourStageId;
  }, [activeTourStepId, activeTourStageId, onboardingItems]);

  const handleItemClick = (item: OnboardingItem) => {

    if (item.completed) {
      // Uncheck the item - mark as incomplete
       const itemId = `${item.stageId}-${item.stepId}`;
      
      // Remove from local completed items
      setLocalCompletedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Add to unchecked items to override persisted completion state
      setUncheckedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      
      setFocusedItemId(item.id);
    } else {
      // Get company name for routing
      const companyName = getCompanyName();
      
      // Check if we need a company for this step
      const stepRequiresCompany = getStepRoute(item.stepId, companyName || '') !== null;
      
      if (stepRequiresCompany && !companyName) {
        // No company available - navigate to company selection page
        onClose();
        navigate('/app/clients');
        return;
      }
      // Close the dialog first
      onClose();
     
      // Always let the tour context handle navigation and tour starting
      // The tour context will:
      // 1. Navigate to the correct route if needed
      // 2. Wait for the page to load
      // 3. Start the tour with the correct timing
      // This avoids double navigation and timing issues
      try {
        navigate(getStepRoute(item.stepId, companyName || '') || '');
        startTour(item.stepId, item.stageId);
      } catch (error) {
        console.error('[Onboarding] ❌ Error calling startTour:', error);
      }
    }
  };

  const completedCount = onboardingItems.filter(item => item.completed).length;
  const totalCount = onboardingItems.length;
  const remainingCount = totalCount - completedCount;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleGetStarted = () => {
    // Complete onboarding when user clicks "Get Started"
    completeOnboarding();
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom right-side panel without blur overlay */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-white shadow-xl border-l transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ zIndex: 9999 }}
      >
        <div className="flex flex-col h-full min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold">{lang('todoistOnboarding.header')}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Overall Progress Section */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">{lang('todoistOnboarding.overallProgress')}</span>
              <span className="text-sm font-semibold text-gray-900">{progressPercentage}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {remainingCount === 1
                ? lang('todoistOnboarding.sectionRemaining', { count: remainingCount })
                : lang('todoistOnboarding.sectionsRemaining', { count: remainingCount })}
            </p>
          </div>

          {/* Checklist Items */}
          <div className="px-6 py-4 space-y-0 flex-1 overflow-y-auto">
            {onboardingItems.map((item, index) => {
              const isFocused = focusedItemId === item.id && !item.completed;
              const isCompleted = item.completed;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between py-3 px-0 cursor-pointer transition-all border-b border-gray-100 last:border-b-0",
                    isFocused && "bg-blue-50 -mx-6 px-6",
                    isCompleted && "opacity-60"
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  {/* Content - Left Side */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm leading-5",
                        isCompleted && "line-through text-gray-500",
                        isFocused && "text-gray-900 font-medium",
                        !isFocused && !isCompleted && "text-gray-900"
                      )}
                    >
                      {getTranslatedStepTitle(item.stepId, item.title)}
                    </div>
                  </div>

                  {/* Checkbox/Circle - Right Side */}
                  <div className="flex-shrink-0 ml-4">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-600" />
                    ) : isFocused ? (
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center ring-4 ring-blue-100">
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 stroke-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Premium Upgrade Section */}
          <div className="mx-6 mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
              <span className="font-semibold text-sm text-orange-900">
                {lang('todoistOnboarding.upgradeToPremium')}
              </span>
            </div>
          </div>

          {/* Help & Learning */}
          <div className="mx-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 py-2">
              <HelpCircle className="h-4 w-4 text-gray-600" />
              <span className="font-medium">{lang('todoistOnboarding.helpAndLearning')}</span>
            </div>
          </div>

          {/* Footer - Get Started with Badge */}
          <div className="border-t px-6 py-3 bg-white">
            <div
              className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleGetStarted}
            >
              <span className="text-sm text-gray-700 mr-2">{lang('todoistOnboarding.getStarted')}</span>
              {remainingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-blue-600 text-white h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full"
                >
                  {remainingCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Transparent overlay without blur - only for mobile to close on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
