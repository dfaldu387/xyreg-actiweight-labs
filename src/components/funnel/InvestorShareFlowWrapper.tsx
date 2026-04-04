import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { VentureBlueprintGuideSidebar } from './VentureBlueprintGuideSidebar';
import { InvestorViewPreviewDrawer } from './InvestorViewPreviewDrawer';
import { GenesisCelebration } from '@/components/product/business-case/genesis/GenesisCelebration';
import { InvestorShareDialog } from '@/components/company/InvestorShareDialog';
import { GapAnnexIISidebar } from '@/components/product/gap-analysis/GapAnnexIISidebar';
import { useViabilityFunnelProgress } from '@/hooks/useViabilityFunnelProgress';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useGenesisFlowSession } from '@/hooks/useGenesisFlowSession';
import { ALL_DEVELOPMENT_STEPS } from '@/components/product/business-case/blueprintStepMapping';
import { findBestMatchingStepIndex } from '@/utils/stepRouteMatching';
import { toast } from 'sonner';
import { InvestorPreviewProvider, useInvestorPreview } from '@/contexts/InvestorPreviewContext';

interface InvestorShareFlowWrapperProps {
  children: React.ReactNode;
  productId: string;
}

interface ChecklistItem {
  label: string;
  complete: boolean;
  route: string;
}

function buildVentureBlueprintChecklist(
  productId: string,
  readinessChecklist: ChecklistItem[]
): ChecklistItem[] {
  // Map readiness checklist completion status to blueprint steps by matching labels
  const completionMap = new Map<string, boolean>();
  readinessChecklist.forEach((item) => {
    // readinessChecklist labels are formatted as "✓ Device Name" or "❌ Device Name"
    // Remove the ✓/❌ prefix to get the clean title
    const cleanLabel = item.label.replace(/^[✓❌]\s*/, '').trim();

    // Try to extract title from "1. Device Name" format (if number prefix exists)
    const matchWithNumber = cleanLabel.match(/^(\d+(?:\.\d+)*[a-z]?)\.\s*(.+)$/i);
    if (matchWithNumber) {
      completionMap.set(matchWithNumber[2].trim().toLowerCase(), item.complete);
    } else {
      // No number prefix - use the clean label directly (e.g., "Device Name")
      completionMap.set(cleanLabel.toLowerCase(), item.complete);
    }
  });

  return ALL_DEVELOPMENT_STEPS.map((step) => ({
    label: `${step.stepNumber}. ${step.title}`,
    route: `/app/product/${productId}/${step.route}`,
    complete: completionMap.get(step.title.toLowerCase()) ?? false,
  }));
}

/**
 * Wrapper component that adds the investor share flow UI elements
 * (banner + guide sidebar) when ?returnTo=investor-share is present
 */
export function InvestorShareFlowWrapper({ children, productId }: InvestorShareFlowWrapperProps) {
  return (
    <InvestorPreviewProvider>
      <InvestorShareFlowWrapperInner productId={productId}>
        {children}
      </InvestorShareFlowWrapperInner>
    </InvestorPreviewProvider>
  );
}

function InvestorShareFlowWrapperInner({ children, productId }: InvestorShareFlowWrapperProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const returnTo = searchParams.get('returnTo');
  const tab = searchParams.get('tab');

  const isVentureBlueprint = returnTo === 'venture-blueprint';
  const isGenesisTab = tab === 'genesis';
  const isInInvestorFlow = returnTo === 'investor-share' || isVentureBlueprint || returnTo === 'genesis';
  const isGapAnalysisFlow = returnTo === 'gap-analysis';
  const isGuidedFlow = isInInvestorFlow || isGapAnalysisFlow;
  // Show drawer for genesis tab OR when in investor flow
  const shouldShowPreviewDrawer = isGenesisTab || isInInvestorFlow;

  const { data: product } = useProductDetails(productId);
  const companyId = product?.company_id || '';

  const { readinessChecklist, overallProgress, isLoading, completionData } = useViabilityFunnelProgress(
    productId,
    companyId
  );

  const ventureBlueprintChecklist = useMemo(() => {
    return buildVentureBlueprintChecklist(productId, readinessChecklist);
  }, [productId, readinessChecklist]);

  const sidebarChecklist = isVentureBlueprint ? ventureBlueprintChecklist : readinessChecklist;

  // Track Genesis flow session
  const { storeSession, refreshSession } = useGenesisFlowSession();

  // Store/refresh session when in investor flow
  useEffect(() => {
    if (isInInvestorFlow && productId) {
      storeSession(productId);
    }
  }, [isInInvestorFlow, productId, storeSession]);

  // Refresh session on user activity while in flow
  useEffect(() => {
    if (!isInInvestorFlow) return;

    const handleActivity = () => refreshSession();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isInInvestorFlow, refreshSession]);

  // Track previous completion state to detect transitions
  const prevCompletionRef = useRef<Record<string, boolean>>({});
  const hasInitializedRef = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingToastsRef = useRef<Set<string>>(new Set());

  // Show toast when checklist items transition from incomplete to complete
  // Debounced to prevent multiple toasts for rapid updates
  useEffect(() => {
    if (isLoading || !isInInvestorFlow) return;

    // Build current completion state map
    const currentCompletion: Record<string, boolean> = {};
    const labelToFriendlyName: Record<string, string> = {
      'Device Description': 'Device Description',
      'Viability scorecard': 'Viability Scorecard',
      'Venture blueprint': 'Venture Blueprint',
      'Business canvas': 'Business Canvas',
      'Team profile': 'Team Profile',
      'Essential Gates': 'Essential Gates',
      'Evidence Plan': 'Evidence Plan',
      'Market Sizing': 'Market Sizing',
      'Reimbursement Strategy': 'Reimbursement Strategy',
      'Risk Analysis': 'Risk Analysis',
      'Health Economic Model': 'Health Economic Model (HEOR)',
    };

    readinessChecklist.forEach((item) => {
      // Extract the key from label (e.g., "Device Description" from "✓ Device Description complete")
      const key = Object.keys(labelToFriendlyName).find(k => item.label.includes(k)) || item.label;
      currentCompletion[key] = item.complete;
    });

    // On first load, just initialize without showing toasts
    if (!hasInitializedRef.current) {
      prevCompletionRef.current = { ...currentCompletion };
      hasInitializedRef.current = true;
      return;
    }

    // Check for transitions from incomplete to complete
    Object.entries(currentCompletion).forEach(([key, isComplete]) => {
      const wasComplete = prevCompletionRef.current[key];
      if (isComplete && !wasComplete) {
        // Add to pending toasts (will be shown after debounce)
        pendingToastsRef.current.add(key);
      }
    });

    // Update previous state
    prevCompletionRef.current = { ...currentCompletion };

    // Debounce toast display - wait 1 second after last change before showing
    if (pendingToastsRef.current.size > 0) {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        pendingToastsRef.current.forEach((key) => {
          const friendlyName = labelToFriendlyName[key] || key;
          toast.success(`Checklist item completed: ${friendlyName}`, {
            description: 'Great progress on your investor readiness!',
            duration: 4000,
          });
        });
        pendingToastsRef.current.clear();
      }, 1000);
    }
  }, [readinessChecklist, isLoading, isInInvestorFlow]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Calculate current step index based on route (best match, not first match)
  const currentPathBase = location.pathname;
  const currentStepIndex = findBestMatchingStepIndex(sidebarChecklist, currentPathBase, searchParams);

  // Get preview drawer state from context
  const { isPreviewOpen: isPreviewDrawerOpen, togglePreview: handleTogglePreviewDrawer, closePreview } = useInvestorPreview();

  // State for celebration dialog
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const prevCompletedCountRef = useRef<number | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedCount = readinessChecklist.filter(item => item.complete).length;
  const totalSteps = readinessChecklist.length;
  const isAllCompleted = completedCount === totalSteps && totalSteps > 0;
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'investor-share';
  const celebrationKey = `genesis-celebrated-${productId}`;

  const hasAlreadyCelebrated = useCallback(() => {
    try {
      return sessionStorage.getItem(celebrationKey) === 'true';
    } catch {
      return false;
    }
  }, [celebrationKey]);

  const markAsCelebrated = useCallback(() => {
    try {
      sessionStorage.setItem(celebrationKey, 'true');
    } catch {
      // Ignore storage errors
    }
  }, [celebrationKey]);

  // Reset celebration key when steps become incomplete (allow re-celebration)
  const resetCelebrationKey = useCallback(() => {
    try {
      sessionStorage.removeItem(celebrationKey);
    } catch {
      // Ignore storage errors
    }
  }, [celebrationKey]);

  // Reset refs when leaving the flow
  useEffect(() => {
    if (!isInGenesisFlow) {
      initialLoadCompleteRef.current = false;
      prevCompletedCountRef.current = null;
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
    }
  }, [isInGenesisFlow]);

  // Reset celebration key when not all steps are complete
  useEffect(() => {
    if (!isLoading && !isAllCompleted && totalSteps > 0) {
      resetCelebrationKey();
    }
  }, [isAllCompleted, isLoading, totalSteps, resetCelebrationKey]);

  useEffect(() => {
    if (!isInGenesisFlow || isLoading) return;

    if (!initialLoadCompleteRef.current) {
      initialLoadCompleteRef.current = true;
      prevCompletedCountRef.current = completedCount;
      return;
    }

    if (isAllCompleted && !hasAlreadyCelebrated()) {
      if (prevCompletedCountRef.current !== null && prevCompletedCountRef.current < totalSteps) {
        // Clear any existing timeout
        if (celebrationTimeoutRef.current) {
          clearTimeout(celebrationTimeoutRef.current);
        }
        // Small delay to let the toast show first
        celebrationTimeoutRef.current = setTimeout(() => {
          // Double-check we're still in the flow before showing
          if (isInGenesisFlow) {
            setShowCelebration(true);
            markAsCelebrated();
          }
        }, 1200);
      }
    }

    prevCompletedCountRef.current = completedCount;
  }, [completedCount, totalSteps, isAllCompleted, isInGenesisFlow, isLoading, hasAlreadyCelebrated, markAsCelebrated]);

  // Cleanup celebration timeout on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

  // If not in any guided flow, render children with optional preview drawer for genesis tab
  if (!isGuidedFlow) {
    return (
      <>
        {children}
        {/* Investor View Preview Drawer - also available on genesis tab */}
        {shouldShowPreviewDrawer && (
          <InvestorViewPreviewDrawer
            isOpen={isPreviewDrawerOpen}
            onClose={closePreview}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-0 w-full relative">
      {/* Main Content - padding matches sidebar width at each breakpoint */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0 md:pr-[268px] lg:pr-[288px] xl:pr-[308px]">
        {children}
      </div>

      {/* Right Sidebar Guide - Fixed position, hidden on mobile */}
      {isGapAnalysisFlow ? (
        <div className="hidden md:block">
          <GapAnnexIISidebar items={product?.gapAnalysis || []} />
        </div>
      ) : (
        !isLoading && companyId && (
          <div className="hidden md:block fixed top-16 right-0 h-[calc(100vh-64px)]">
            <VentureBlueprintGuideSidebar
              productId={productId}
              readinessChecklist={sidebarChecklist}
              currentStepIndex={currentStepIndex}
              overallProgress={overallProgress}
              returnTo={returnTo || 'genesis'}
              completionData={completionData}
              onTogglePreviewDrawer={handleTogglePreviewDrawer}
              isPreviewDrawerOpen={isPreviewDrawerOpen}
            />
          </div>
        )
      )}

      {/* Investor View Preview Drawer (manually controlled) */}
      <InvestorViewPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        onClose={closePreview}
      />

      {/* Genesis Completion Celebration - only in returnTo flow */}
      {isInGenesisFlow && (
        <GenesisCelebration
          open={showCelebration}
          onOpenChange={setShowCelebration}
          totalSteps={totalSteps}
          productId={productId}
          onShareWithInvestors={() => {
            setShowCelebration(false);
            setShowShareDialog(true);
          }}
        />
      )}

      {/* Investor Share Dialog */}
      {companyId && (
        <InvestorShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          companyId={companyId}
          companyName={product?.company || 'Company'}
          productId={productId}
        />
      )}
    </div>
  );
}
