import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar, Clock, Plus, RefreshCw, BarChart3, Target, Settings, CalendarDays, Activity, DollarSign, Link, ArrowLeft, Eye, Settings2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PhaseTimelineManager } from "@/components/product/timeline/PhaseTimelineManager";
import { SetDatesDialog } from "@/components/product/timeline/SetDatesDialog";
// import { EnhancedGanttChart } from "@/components/product/timeline/EnhancedGanttChart";
import { useProductPhases } from "@/hooks/useProductPhases";
import { useProductDetails } from "@/hooks/useProductDetails";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { differenceInDays, addDays } from 'date-fns';
import { computeNextPMSDueDate } from '@/utils/computeNextPMSDueDate';
import { formatDeviceClassCode } from '@/utils/deviceClassUtils';
import { resolveHighestRiskClass } from '@/utils/pmsDeviceClassResolver';
import { ProductUpdateService } from '@/services/productUpdateService';
import { ProductNavigationTracker } from '@/components/product/ProductNavigationTracker';
import { useTimelineCalculation } from '@/hooks/useTimelineCalculation';
import { SyncPhasesButton } from '@/components/SyncPhasesButton';
import { ManualTimelineInitButton } from '@/components/product/ManualTimelineInitButton';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { useProductPhaseDependencies } from '@/hooks/useProductPhaseDependencies';
import { useUserPreferences, type MilestonesViewType } from '@/hooks/useUserPreferences';
import { BulkBudgetOperationsDialog } from '@/components/budget/BulkBudgetOperationsDialog';
import { BudgetCostChart } from '@/components/budget/BudgetCostChart';
// import { GanttChartV2 } from '@/components/product/timeline/GanttChartV2';
// import ProductGanttV3Page from './ProductGanttV3Page';
// import SvarGanttChart from '@/components/product/timeline/SvarGanttChart';
import { ProductPhaseDependencyDialog } from '@/components/product/dependencies/ProductPhaseDependencyDialog';
import { EnhancedRecalculationService } from '@/services/enhancedRecalculationService';
import { PostLaunchPhaseService } from '@/services/postLaunchPhaseService';
import { EnhancedPhaseSyncService } from '@/services/enhancedPhaseSyncService';
import { ProductPhaseDependencyService } from '@/services/productPhaseDependencyService';
import ProductGanttV23Page from './ProductGanttV23Page';
import { useTranslation } from '@/hooks/useTranslation';
import { FloatingReturnButton } from '@/components/funnel/FloatingReturnButton';
import { InvestorShareFlowWrapper } from '@/components/funnel/InvestorShareFlowWrapper';

export default function ProductMilestonesPage() {
  const { lang } = useTranslation();
  const {
    productId
  } = useParams<{
    productId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { fromFeasibilityStudy, bundleId, portfolioId } = location.state || {};

  // Check for investor flow return and auto-open dates dialog
  const isInInvestorFlow = searchParams.get('returnTo') === 'investor-share';
  const shouldOpenDates = searchParams.get('openDates') === 'true';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { defaultMilestonesView, isLoading: preferencesLoading } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<MilestonesViewType>("milestones");
  const [showBulkBudget, setShowBulkBudget] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);
  const [showDatesDialog, setShowDatesDialog] = useState(false);
  const [timelineMode, setTimelineMode] = useState<'forward' | 'backward'>('forward');
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [recalculateMode, setRecalculateMode] = useState<'company-settings' | 'preserve-manual' | 'sync-company'>('preserve-manual');
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [showSyncConfirmDialog, setShowSyncConfirmDialog] = useState(false);
  const [isSyncingFromCompany, setIsSyncingFromCompany] = useState(false);
  const [syncMode, setSyncMode] = useState<'full-replace' | 'keep-existing'>('keep-existing');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Update activeTab when preferences load - only once on initial load
  const initialTabSetRef = useRef(false);
  useEffect(() => {
    if (!preferencesLoading && !initialTabSetRef.current) {
      initialTabSetRef.current = true;
      setActiveTab(defaultMilestonesView);
    }
  }, [defaultMilestonesView, preferencesLoading]);

  // Auto-open dates dialog when coming from investor flow
  useEffect(() => {
    if (shouldOpenDates && !showDatesDialog) {
      setShowDatesDialog(true);
      // Clear the openDates param from URL to prevent re-opening on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('openDates');
      setSearchParams(newParams, { replace: true });
    }
  }, [shouldOpenDates]);

  // Refetch funnel-phases when dates dialog opens to update sidebar completion status
  useEffect(() => {
    if (showDatesDialog && productId) {
      queryClient.refetchQueries({ queryKey: ['funnel-phases', productId], type: 'all' });
    }
  }, [showDatesDialog, productId, queryClient]);

  // Fetch product details
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProduct
  } = useProductDetails(productId);

  // Fetch phases with the enhanced hook
  const productPhasesResult = useProductPhases(productId, product?.company_id, product);

  const {
    phases: rawPhases,
    isLoading,
    error,
    timelineAdvisories,
    timelineConfig,
    hasUnscheduledPhases,
    fetchPhases,
    refetch,
    handleSetCurrentPhase,
    handlePhaseStatusChange,
    updateTimelineMode,
    handlePhaseStartDateChange,
    handlePhaseEndDateChange,
    handleBatchPhaseUpdates,
    initializeDefaultTimeline,
    initializeTemplateTimeline,
    getPhaseLoadingState
  } = productPhasesResult;

  const phases = useMemo(() => {
    if (Array.isArray(rawPhases)) {
      return rawPhases;
    }
    return [];
  }, [rawPhases]);

  // Timeline calculation hook
  const {
    mode: calculationMode,
    setMode,
    recalculateTimeline
  } = useTimelineCalculation();

  // Phase dependencies hook
  const {
    dependencies: companyDependencies,
    loadDependencies: loadCompanyDependencies
  } = usePhaseDependencies(product?.company_id || '');

  const {
    dependencies: productDependencies,
    loading: productDependenciesLoading,
    refetch: refetchProductDependencies,
    hasProductDependencies
  } = useProductPhaseDependencies(productId);

  // Calculate market status for badges (must be at top level)
  const marketStatus = useProductMarketStatus(product?.markets);

  // Load company dependencies when product is available (deferred to not block render)
  useEffect(() => {
    if (product?.company_id) {
      // Defer loading to let UI render first
      const timer = setTimeout(() => {
        loadCompanyDependencies();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [product?.company_id, loadCompanyDependencies]);

  // Determine which dependencies to use (product-level takes priority)
  const activeDependencies = useMemo(() => {
    if (hasProductDependencies) {
      // Convert product dependencies to the format expected by EnhancedDependencyService
      return productDependencies.map(dep => ({
        id: dep.id,
        source_phase_id: dep.source_phase_id,
        target_phase_id: dep.target_phase_id,
        dependency_type: dep.dependency_type,
        lag_days: dep.lag_days,
        company_id: product?.company_id || '',
        created_at: dep.created_at,
        updated_at: dep.updated_at
      }));
    } else if (companyDependencies && companyDependencies.length > 0) {
      return companyDependencies;
    } else {
      return [];
    }
  }, [hasProductDependencies, productDependencies, companyDependencies, product?.company_id]);

  // Calculate project start date - use dedicated field first, fallback to phases
  const projectStartDate = useMemo((): Date | undefined => {
    // First priority: use the dedicated project_start_date field
    if ((product as any)?.project_start_date) {
      return new Date((product as any).project_start_date);
    }

    // Fallback: calculate from phases (existing logic)
    if (!phases || phases.length === 0) return undefined;
    const phasesWithStartDates = phases.filter(phase => phase.start_date);
    if (phasesWithStartDates.length === 0) return undefined;
    return phasesWithStartDates.map(phase => new Date(phase.start_date)).sort((a, b) => a.getTime() - b.getTime())[0];
  }, [(product as any)?.project_start_date, phases]);

  // Store the last recalculation result to use calculated dates
  const [lastRecalculationResult, setLastRecalculationResult] = useState<any>(null);

  // Check and create Post-Launch phase for launched products
  // Only run once on initial load, deferred to not block render
  const postLaunchCheckedRef = useRef(false);
  useEffect(() => {
    // Skip if already checked or missing required data
    if (postLaunchCheckedRef.current || !productId || !product?.company_id || !phases || phases.length === 0) {
      return;
    }

    // Defer to not block initial render
    const timer = setTimeout(async () => {
      if (postLaunchCheckedRef.current) return;
      postLaunchCheckedRef.current = true;

      try {
        const result = await PostLaunchPhaseService.ensurePostLaunchPhase(productId, product.company_id);
        // Only refetch if a new phase was actually created
        if ((result as any)?.created) {
          await refetch();
        }
      } catch (error) {
        // Post-launch phase check failed silently
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [productId, product?.company_id, phases?.length, refetch]);

  // Transform phases for both timeline and gantt chart with dependency calculations
  const timelinePhases = useMemo(() => {
    if (!phases || phases.length === 0) {
      return [];
    }

    // Filter out "No Phase" phases - these are placeholder phases that shouldn't be displayed
    const filteredPhases = phases.filter(phase =>
      phase.name?.toLowerCase() !== 'no phase'
    );

    if (filteredPhases.length === 0) {
      return [];
    }

    // Use calculated dates from last recalculation if available
    if (lastRecalculationResult && lastRecalculationResult.updatedPhases) {
      const result = lastRecalculationResult.updatedPhases
        .filter(phase => phase.name?.toLowerCase() !== 'no phase')
        .map(phase => ({
          id: phase.id,
          phase_id: phase.phase_id || '',
          name: phase.name,
          startDate: phase.startDate,
          endDate: phase.endDate,
          status: filteredPhases.find(p => p.id === phase.id)?.status || 'Not Started',
          isCurrentPhase: filteredPhases.find(p => p.id === phase.id)?.is_current_phase || false,
          isOverdue: filteredPhases.find(p => p.id === phase.id)?.is_overdue || false,
          position: phase.position,
          likelihood_of_success: filteredPhases.find(p => p.id === phase.id)?.likelihood_of_success,
          start_date: phase.startDate?.toISOString(),
          duration_days: phase.duration_days,
          is_continuous_process: phase.is_continuous_process,
          start_percentage: phase.start_percentage,
          end_percentage: phase.end_percentage,
          is_pre_launch: true,
          category_id: filteredPhases.find(p => p.id === phase.id) ? (filteredPhases.find(p => p.id === phase.id) as any).category_id : undefined,
          sub_section_id: filteredPhases.find(p => p.id === phase.id) ? (filteredPhases.find(p => p.id === phase.id) as any).sub_section_id : undefined
        }));
      return result;
    }

    // Fallback to original database dates (using filteredPhases)
    const result = filteredPhases.map(phase => ({
      id: phase.id,
      phase_id: phase.phase_id || '',
      name: phase.name,
      startDate: phase.start_date ? new Date(phase.start_date) : undefined,
      endDate: phase.end_date ? new Date(phase.end_date) : undefined,
      status: phase.status || 'Not Started',
      isCurrentPhase: phase.is_current_phase || false,
      isOverdue: phase.is_overdue || false,
      position: phase.position || 0,
      is_continuous_process: phase.is_continuous_process,
      start_percentage: phase.start_percentage,
      end_percentage: phase.end_percentage,
      category_id: (phase as any).category_id,
      sub_section_id: (phase as any).sub_section_id
    }));

    return result;
  }, [phases, lastRecalculationResult]);

  // Calculate some basic stats (moved before early returns to satisfy Rules of Hooks)
  const totalPhases = timelinePhases?.length || 0;
  const completedPhases = timelinePhases?.filter(p => p.status === 'Completed').length || 0;

  // Calculate overall progress - include ALL phases
  // For launched products, exclude PMS from completion calc (PMS is ongoing, not a dev phase)
  const overallProgress = useMemo(() => {
    if (totalPhases === 0) return 0;
    const isLaunched = (product as any)?.launch_status === 'launched';
    if (isLaunched && timelinePhases) {
      const devPhases = timelinePhases.filter(p =>
        !p.name.toLowerCase().includes('post-market') &&
        !p.name.toLowerCase().includes('pms')
      );
      if (devPhases.length === 0) return 100;
      const completed = devPhases.filter(p => p.status === 'Completed').length;
      return Math.round((completed / devPhases.length) * 100);
    }
    return Math.round(completedPhases / totalPhases * 100);
  }, [totalPhases, completedPhases, timelinePhases, product]);

  // Function to preserve scroll position during updates
  const preserveScrollPosition = () => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };
  const restoreScrollPosition = () => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  };
  const handlePhaseUpdateWithScrollPreservation = async () => {
    preserveScrollPosition();
    await refetch();
    // Use a small delay to ensure DOM updates are complete
    setTimeout(restoreScrollPosition, 50);
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      preserveScrollPosition();

      // NOTE: Auto-sync has been removed. Phases should only sync when user
      // explicitly requests it via "Settings Sync" button (Full Replace / Keep Existing options).

      await Promise.all([refetchProduct(), refetch()]);
      restoreScrollPosition();
      toast.success(lang('productMilestones.toasts.timelineRefreshed'));
    } catch (error) {
      toast.error(lang('productMilestones.toasts.failedRefresh'));
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleArchive = async () => {
    if (!product?.id) return;
    try {
      // Archive logic would go here
      toast.success(lang('productMilestones.toasts.deviceArchived'));
    } catch (error) {
      toast.error(lang('productMilestones.toasts.failedArchive'));
    }
  };

  // Handle Sync from Company - syncs phases and dependencies from company settings
  const handleSyncFromCompany = async (mode: 'full-replace' | 'keep-existing') => {
    if (!productId || !product?.company_id) return;

    setIsSyncingFromCompany(true);
    try {
      const { PhaseSynchronizationService } = await import('@/services/phaseSynchronizationService');

      if (mode === 'full-replace') {
        // Full replace: Delete all existing phases and sync fresh from company
        const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(productId, product.company_id);

        if (!syncResult.success) {
          toast.error(lang('productMilestones.toasts.failedSyncPhases', { errors: syncResult.errors.join(', ') }));
          return;
        }

        // Then, copy dependencies from active phases
        const result = await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
          productId,
          product.company_id,
          true // Replace existing dependencies
        );

        if (result.success) {
          toast.success(lang('productMilestones.toasts.replacedPhasesAndDependencies', { phaseCount: syncResult.syncedCount, dependencyCount: result.initializedCount || 0 }));
          await Promise.all([refetchProduct(), refetch(), refetchProductDependencies()]);
        } else {
          toast.error(result.error || lang('productMilestones.toasts.failedSyncFromCompany'));
        }
      } else {
        // Keep existing: Only add new phases from company that don't exist
        const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhasesKeepExisting(productId, product.company_id);

        if (!syncResult.success) {
          toast.error(lang('productMilestones.toasts.failedSyncPhases', { errors: syncResult.errors.join(', ') }));
          return;
        }

        // Try to sync dependencies without replacing existing ones (non-blocking)
        let dependenciesCount = 0;
        try {
          const result = await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
            productId,
            product.company_id,
            false // Don't replace existing dependencies
          );

          if (result.success && result.initializedCount && result.initializedCount > 0) {
            dependenciesCount = result.initializedCount;
          }
        } catch (depError) {
          // Don't fail the entire operation if dependency sync fails
        }

        // Show success message
        if (syncResult.addedCount > 0) {
          toast.success(lang('productMilestones.toasts.addedNewPhases', { addedCount: syncResult.addedCount, dependencyCount: dependenciesCount, keptCount: syncResult.keptCount }));
        } else {
          toast.success(lang('productMilestones.toasts.noNewPhasesToAdd', { keptCount: syncResult.keptCount }));
        }
        await Promise.all([refetchProduct(), refetch(), refetchProductDependencies()]);
      }
    } catch (error) {
      toast.error(lang('productMilestones.toasts.failedSyncFromCompany'));
    } finally {
      setIsSyncingFromCompany(false);
    }
  };

  // Helper: extract the most stringent (highest) risk class from selected markets
  const getHighestRiskClassFromMarkets = (markets?: any[]) => resolveHighestRiskClass(markets);

  // Calculate days to finish project
  const calculateDaysToFinish = () => {
    const today = new Date();

    // Check if all phases are completed
    const allPhasesCompleted = phases && phases.length > 0 && phases.every(p => p.status === 'Completed');

    // Derive launch status from markets (per-market field, not product-level)
    const productMarkets = (product as any)?.markets as Array<{ selected?: boolean; marketLaunchStatus?: string; riskClass?: string; componentClassification?: { overallRiskClass?: string } }> | undefined;
    const hasLaunchedMarket = productMarkets?.some(m => m.selected && m.marketLaunchStatus === 'launched');
    const isLaunched = allPhasesCompleted || !!hasLaunchedMarket;
    
    if (isLaunched) {
      // Extract most stringent risk class from selected markets
      const deviceClass = getHighestRiskClassFromMarkets(productMarkets);
      const launchDateStr = product?.actual_launch_date || product?.projected_launch_date;
      
      const pmsResult = computeNextPMSDueDate(deviceClass, launchDateStr);
      
      // Class I: no periodic PMS required
      if (!pmsResult.requiresPeriodicPMS) {
        return {
          days: 0,
          isOverdue: false,
          endDate: launchDateStr ? new Date(launchDateStr) : today,
          source: 'pms_not_applicable',
          isLaunched: true
        };
      }

      // Has computed next due date
      if (pmsResult.nextDueDate) {
        const daysUntilReview = differenceInDays(pmsResult.nextDueDate, today);
        return {
          days: Math.abs(daysUntilReview),
          isOverdue: daysUntilReview < 0,
          endDate: pmsResult.nextDueDate,
          source: 'pms_class_interval',
          isLaunched: true
        };
      }

      // Launched but no launch date available — fallback to static field
      if ((product as any)?.post_market_surveillance_date) {
        const pmsDate = new Date((product as any).post_market_surveillance_date);
        const daysUntilPMS = differenceInDays(pmsDate, today);
        return {
          days: Math.abs(daysUntilPMS),
          isOverdue: daysUntilPMS < 0,
          endDate: pmsDate,
          source: 'post_market_surveillance_date',
          isLaunched: true
        };
      }

      return {
        days: 0,
        isOverdue: false,
        endDate: launchDateStr ? new Date(launchDateStr) : today,
        source: 'launched',
        isLaunched: true
      };
    }

    // For products in development, use projected launch date
    if (product?.projected_launch_date) {
      const projectedLaunchDate = new Date(product.projected_launch_date);
      const daysRemaining = differenceInDays(projectedLaunchDate, today);
      return {
        days: Math.abs(daysRemaining),
        isOverdue: daysRemaining < 0,
        endDate: projectedLaunchDate,
        source: 'projected_launch_date',
        isLaunched: false
      };
    }

    // Fallback to latest phase end date
    if (phases && phases.length > 0) {
      const phasesWithEndDates = phases.filter(p => p.end_date);
      if (phasesWithEndDates.length > 0) {
        const latestEndDate = new Date(Math.max(...phasesWithEndDates.map(p => new Date(p.end_date!).getTime())));
        const daysRemaining = differenceInDays(latestEndDate, today);
        return {
          days: Math.abs(daysRemaining),
          isOverdue: daysRemaining < 0,
          endDate: latestEndDate,
          source: 'phase_end_dates',
          isLaunched: false
        };
      }
    }
    return null;
  };

  // Calculate days to freeze
  const calculateDaysToFreeze = () => {
    if (!product?.design_freeze_date) return null;
    const today = new Date();
    const freezeDate = new Date(product.design_freeze_date);
    const daysRemaining = differenceInDays(freezeDate, today);
    return {
      days: Math.abs(daysRemaining),
      isOverdue: daysRemaining < 0,
      endDate: freezeDate
    };
  };

  // Show loading state
  if (productLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">{lang('productMilestones.loading')}</p>
      </div>
    </div>;
  }

  // Show error state
  if (productError || error) {
    const errorMessage = productError?.message || error?.message || lang('productMilestones.unknownError');
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold text-destructive">{lang('productMilestones.errorLoading')}</h2>
        <p className="text-muted-foreground max-w-md">{errorMessage}</p>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {lang('productMilestones.tryAgain')}
        </Button>
      </div>
    </div>;
  }

  // Show not found state
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">{lang('productMilestones.deviceNotFound')}</h2>
        <p className="text-muted-foreground">{lang('productMilestones.deviceNotFoundDescription')}</p>
      </div>
    </div>;
  }

  const handleReinitializeTimeline = async () => {
    setIsReinitializing(true);
    setShowRecalculateDialog(false);

    try {
      // Handle sync-company mode: reset phases from company settings
      if (recalculateMode === 'sync-company') {
        const syncResult = await EnhancedPhaseSyncService.emergencyPhaseRecovery(
          productId!,
          product?.company_id || ''
        );

        if (!syncResult.success) {
          toast.error(lang('productMilestones.toasts.failedSyncPhases', { errors: syncResult.errors.join(', ') }));
          return;
        }

        toast.success(lang('productMilestones.toasts.syncedPhasesFromCompany', { count: syncResult.syncedCount }));
        await refetch();
        setIsReinitializing(false);
        return;
      }

      // Prepare recalculation options
      const recalculationOptions = {
        mode: recalculateMode,
        timelineMode: timelineMode,
        projectStartDate: projectStartDate,
        projectedLaunchDate: product?.projected_launch_date ? new Date(product.projected_launch_date) : undefined,
        enforceConstraints: false // Allow timeline to extend beyond projected launch date
      };

      // Execute enhanced recalculation
      const result = await EnhancedRecalculationService.recalculateTimeline(
        productId!,
        product?.company_id || '',
        recalculationOptions,
        activeDependencies
      );

      if (result.success) {
        // Store the recalculation result to use calculated dates in timelinePhases
        setLastRecalculationResult(result);

        const message = recalculateMode === 'company-settings'
          ? lang('productMilestones.toasts.recalculatedWithCompanySettings', { count: result.updatedPhases.length })
          : lang('productMilestones.toasts.recalculatedPreservingManual', { count: result.updatedPhases.length });

        toast.success(message);

        // Show warnings if any
        if (result.warnings.length > 0) {
          toast.warning(lang('productMilestones.toasts.recalculationWarnings', { count: result.warnings.length }));
        }

        // Refresh the data
        await refetch();

      } else {
        // console.error('[ProductMilestonesPage] Recalculation failed:', result.errors);
        toast.error(lang('productMilestones.toasts.failedRecalculate'));
      }

    } catch (error) {
      // console.error('[ProductMilestonesPage] Error during enhanced recalculation:', error);
      toast.error(lang('productMilestones.toasts.failedRecalculate'));
    } finally {
      setIsReinitializing(false);
    }
  };
  const handleDesignFreezeDateChange = async (date: Date | undefined) => {
    if (!product?.id) return;
    setIsUpdatingDates(true);
    try {
      await ProductUpdateService.updateProductField(product.id, 'design_freeze_date', date?.toISOString() || null, product.company_id);
      toast.success(lang('productMilestones.toasts.designFreezeDateUpdated'));
      refetchProduct();
    } catch (error) {
      // console.error('Error updating design freeze date:', error);
      toast.error(lang('productMilestones.toasts.failedUpdateDesignFreezeDate'));
    } finally {
      setIsUpdatingDates(false);
    }
  };
  const handleProjectedLaunchDateChange = async (date: Date | undefined) => {
    if (!product?.id) return;
    setIsUpdatingDates(true);
    try {
      await ProductUpdateService.updateProductField(product.id, 'projected_launch_date', date?.toISOString() || null, product.company_id);
      toast.success(lang('productMilestones.toasts.projectedLaunchDateUpdated'));
      refetchProduct();
    } catch (error) {
      // console.error('Error updating projected launch date:', error);
      toast.error(lang('productMilestones.toasts.failedUpdateProjectedLaunchDate'));
    } finally {
      setIsUpdatingDates(false);
    }
  };
  const handleProjectStartDateChange = async (date: Date | undefined) => {
    if (!date || !productId) return;
    setIsUpdatingDates(true);
    try {
      // Update the product's dedicated project_start_date field
      await ProductUpdateService.updateProductField(productId, 'project_start_date', date.toISOString().split('T')[0]);
      await refetchProduct();
      toast.success(lang('productMilestones.toasts.projectStartDateUpdated'));
    } catch (error) {
      // console.error('Error updating project start date:', error);
      toast.error(lang('productMilestones.toasts.failedUpdateProjectStartDate'));
    } finally {
      setIsUpdatingDates(false);
    }
  };
  const handlePostMarketSurveillanceDateChange = async (date: Date | undefined) => {
    if (!product?.id) return;
    setIsUpdatingDates(true);
    try {
      await ProductUpdateService.updateProductField(product.id, 'post_market_surveillance_date', date?.toISOString() || null, product.company_id);

      // Log PMS scheduling logic for debugging
      if (date) {
        const {
          formatDeviceClassCode
        } = await import('@/utils/deviceClassUtils');
        const {
          getPMSSchedule
        } = await import('@/utils/pmsSchedulingUtils');

        // Try to get device class from various sources
        const deviceClass = (product as any).risk_class || (product as any).device_class || (product as any).eudamed_risk_class;
        const normalizedClass = formatDeviceClassCode(deviceClass);
        const markets = product.markets || [];
        const schedule = getPMSSchedule(normalizedClass, markets, true);
        if (schedule.primaryMarket?.reportType === 'On-Demand') {
          toast.success(lang('productMilestones.toasts.pmsDateSetOnDemand', { deviceClass: normalizedClass }));
        } else if (schedule.primaryMarket) {
          toast.success(lang('productMilestones.toasts.pmsDateSetWithSchedule', { reportType: schedule.primaryMarket.reportType, interval: schedule.primaryMarket.interval }));
        } else {
          toast.success(lang('productMilestones.toasts.pmsDateUpdated'));
        }
      } else {
        toast.success(lang('productMilestones.toasts.pmsDateUpdated'));
      }
      refetchProduct();
    } catch (error) {
      toast.error(lang('productMilestones.toasts.failedUpdatePmsDate'));
    } finally {
      setIsUpdatingDates(false);
    }
  };
  // Genesis: Confirm timeline dates
  const handleConfirmTimeline = async () => {
    if (!productId) return;
    await ProductUpdateService.updateProductField(productId, 'timeline_confirmed', true, product?.company_id);
    // Refetch product data so the sidebar picks up the confirmed state
    refetchProduct();
    queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
  };

  const handleTimelineModeChange = async (mode: 'forward' | 'backward') => {
    setTimelineMode(mode);
    setMode(mode);

    // Check if we have the required data for backward planning
    if (mode === 'backward' && !product?.projected_launch_date) {
      toast.error(lang('productMilestones.toasts.setProjectedLaunchDateFirst'));
      return;
    }

    // Check if we have the required data for forward planning
    if (mode === 'forward' && !projectStartDate) {
      toast.error(lang('productMilestones.toasts.setProjectStartDateFirst'));
      return;
    }
    if (timelinePhases.length === 0) {
      toast.error(lang('productMilestones.toasts.noPhasesAvailable'));
      return;
    }
    try {
      // Prepare phases for calculation
      const phasesForCalculation = timelinePhases.map(phase => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate,
        endDate: phase.endDate,
        duration_days: phase.duration_days || 30,
        position: phase.position || 0,
        is_continuous_process: phase.is_continuous_process,
        start_percentage: phase.start_percentage,
        end_percentage: phase.end_percentage
      }));
      const result = await recalculateTimeline(mode, phasesForCalculation, projectStartDate, product?.projected_launch_date ? new Date(product.projected_launch_date) : undefined, product?.company_id, activeDependencies);

      // Apply the calculated dates to phases using batch update
      if (result.updatedPhases.length > 0) {
        const phaseUpdates = result.updatedPhases.map(updatedPhase => ({
          phaseId: updatedPhase.id,
          startDate: updatedPhase.startDate,
          endDate: updatedPhase.endDate
        }));

        // Use batch update if available, otherwise individual updates
        if (handleBatchPhaseUpdates) {
          await handleBatchPhaseUpdates(phaseUpdates);
        } else {
          // Fallback to individual updates
          for (const update of phaseUpdates) {
            if (update.startDate) {
              await handlePhaseStartDateChange(update.phaseId, update.startDate);
            }
            if (update.endDate) {
              await handlePhaseEndDateChange(update.phaseId, update.endDate);
            }
          }
        }
        toast.success(lang('productMilestones.toasts.timelineRecalculatedWithMode', { mode: mode === 'forward' ? lang('productMilestones.planning.forward') : lang('productMilestones.planning.backward') }));
        await refetch(); // Refresh the data
      }
    } catch (error) {
      toast.error(lang('productMilestones.toasts.failedRecalculate'));
    }
  };

  // Calculate remaining stats (totalPhases/completedPhases moved above early returns)
  const overduePhases = timelinePhases?.filter(p => p.isOverdue).length || 0;
  const daysToFinish = calculateDaysToFinish();
  const daysToFreeze = calculateDaysToFreeze();

  // Calculate days overdue
  const calculateDaysOverdue = () => {
    if (!timelinePhases || timelinePhases.length === 0) return 0;
    const today = new Date();
    let maxDaysOverdue = 0;
    timelinePhases.forEach(phase => {
      if (phase.isOverdue && phase.endDate) {
        const endDate = new Date(phase.endDate);
        const daysOverdue = Math.abs(differenceInDays(today, endDate));
        maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);
      }
    });
    return maxDaysOverdue;
  };
  const daysOverdue = calculateDaysOverdue();

  return (
    <InvestorShareFlowWrapper productId={productId!}>
      <ProductNavigationTracker />
      <div className="flex h-full min-h-0 flex-col">
        <ProductPageHeader
          product={product}
          subsection="Milestones"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          marketStatus={marketStatus}
        />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="py-6 space-y-6">

            {/* Return to Xyreg Genesis Button (investor flow) */}
            {isInInvestorFlow && (
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {lang('productMilestones.returnToGenesis')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {lang('productMilestones.configureTimelineDates')}
                </span>
              </div>
            )}

            {/* Back to Feasibility Study Button */}
            {fromFeasibilityStudy && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/app/commercial', { state: { selectedBundleId: bundleId } })}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {lang('productMilestones.backToFeasibilityStudy')}
                </Button>
              </div>
            )}
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{lang('productMilestones.stats.totalPhases')}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-2xl font-bold">{totalPhases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{lang('productMilestones.stats.completed')}</CardTitle>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {completedPhases}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                  <p className="text-xs text-muted-foreground">{lang('productMilestones.stats.overallProgress')}</p>
                </CardContent>
              </Card>

              <Card 
                className={daysToFinish?.isLaunched ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
                onClick={daysToFinish?.isLaunched ? () => navigate(`/app/product/${productId}/post-market-surveillance`) : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">
                    {daysToFinish?.isLaunched ? lang('productMilestones.stats.daysUntilPMS') : lang('productMilestones.stats.daysToFinish')}
                  </CardTitle>
                  <Target className={`h-4 w-4 ${daysToFinish?.isOverdue ? 'text-destructive' : 'text-blue-500'}`} />
                </CardHeader>
                <CardContent className="pb-2">
                  {daysToFinish ? <>
                    <div className={`text-2xl font-bold ${daysToFinish.isOverdue ? 'text-destructive' : ''}`}>
                      {daysToFinish.source === 'pms_not_applicable' ? 'N/A' : daysToFinish.days}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {daysToFinish.source === 'pms_not_applicable'
                        ? 'Class I — no periodic PMS review'
                        : daysToFinish.source === 'pms_class_interval'
                          ? `${lang('productMilestones.stats.daysUntilNextPMS')} (launched)`
                          : daysToFinish.isLaunched
                            ? daysToFinish.isOverdue ? lang('productMilestones.stats.daysOverduePMS') : `${lang('productMilestones.stats.daysUntilNextPMS')} (launched)`
                            : daysToFinish.isOverdue ? lang('productMilestones.stats.daysOverdue') : lang('productMilestones.stats.daysRemaining')}
                      {!daysToFinish.isLaunched && (
                        daysToFinish.source === 'projected_launch_date'
                          ? ` (${lang('productMilestones.stats.launchDate')})`
                          : daysToFinish.source === 'post_market_surveillance_date'
                            ? ` (${lang('productMilestones.stats.pmsDate')})`
                            : ` (${lang('productMilestones.stats.phaseDates')})`
                      )}
                    </p>
                    {daysToFinish.isLaunched && daysToFinish.source !== 'pms_not_applicable' && (
                      <p className="text-xs text-primary mt-1">View PMS →</p>
                    )}
                  </> : <>
                    <div className="text-2xl font-bold text-muted-foreground">--</div>
                    <p className="text-xs text-muted-foreground">{lang('productMilestones.stats.noEndDatesSet')}</p>
                  </>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{lang('productMilestones.stats.daysToFreeze')}</CardTitle>
                  <Clock className={`h-4 w-4 ${daysToFreeze?.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent className="pb-2">
                  {daysToFreeze ? <>
                    <div className={`text-2xl font-bold ${daysToFreeze.isOverdue ? 'text-destructive' : ''}`}>
                      {daysToFreeze.days}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {daysToFreeze.isOverdue ? lang('productMilestones.stats.daysOverdue') : lang('productMilestones.stats.daysRemaining')}
                    </p>
                  </> : <>
                    <div className="text-2xl font-bold text-muted-foreground">--</div>
                    <p className="text-xs text-muted-foreground">{lang('productMilestones.stats.noFreezeDateSet')}</p>
                  </>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{lang('productMilestones.stats.daysOverdueTitle')}</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-2xl font-bold text-destructive">{daysOverdue}</div>
                  <p className="text-xs text-muted-foreground">
                    {daysOverdue === 0
                      ? lang('productMilestones.stats.noOverduePhases')
                      : lang('productMilestones.stats.phasesOverdue', { count: overduePhases })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dates Dialog - Enhanced with tabs and editable phase dates */}
            <SetDatesDialog
              open={showDatesDialog}
              onOpenChange={setShowDatesDialog}
              projectStartDate={projectStartDate}
              designFreezeDate={product?.design_freeze_date}
              projectedLaunchDate={product?.projected_launch_date}
              timelineMode={timelineMode}
              onProjectStartDateChange={handleProjectStartDateChange}
              onDesignFreezeDateChange={handleDesignFreezeDateChange}
              onProjectedLaunchDateChange={handleProjectedLaunchDateChange}
              onTimelineModeChange={handleTimelineModeChange}
              phases={phases.filter(p => p.name?.toLowerCase() !== 'no phase')}
              onPhaseStartDateChange={handlePhaseStartDateChange}
              onPhaseEndDateChange={handlePhaseEndDateChange}
              defaultTab={isInInvestorFlow ? 'budget' : 'timeline-overview'}
              productId={productId}
              companyId={product?.company_id}
              timelineConfirmed={Boolean(product?.timeline_confirmed)}
              onConfirmTimeline={handleConfirmTimeline}
            />

            {/* Timeline Initialization */}
            {(hasUnscheduledPhases || totalPhases === 0) && <Card className="border-amber-200 bg-amber-50">
              <CardContent className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">{lang('productMilestones.noTimelineDatesSet')}</p>
                      <p className="text-xs text-amber-600">{lang('productMilestones.noTimelineDatesDescription')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ManualTimelineInitButton productId={productId!} companyId={product?.company_id} onInitialized={refetch} />
                  </div>
                </div>
              </CardContent>
            </Card>}


            {/* Tabs for Milestones and Gantt Chart */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MilestonesViewType)} className="w-full">
              <div className="flex justify-between items-start gap-4">
                {/* Milestones dropdown - left side */}
                <Select value={activeTab} onValueChange={(value) => setActiveTab(value as MilestonesViewType)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="milestones">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {lang('productMilestones.tabs.milestones')}
                      </div>
                    </SelectItem>
                    <SelectItem value="gantt" disabled={hasUnscheduledPhases}>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {lang('productMilestones.tabs.ganttChart')}
                      </div>
                    </SelectItem>
                    <SelectItem value="costs">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {lang('productMilestones.tabs.costChart')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Actions - right side */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-background"
                    onClick={() => setShowDatesDialog(true)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {lang('productMilestones.buttons.setDates')}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2 bg-background">
                        <Settings2 className="h-4 w-4" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => setTimeout(() => setShowBulkBudget(true), 0)}>
                        <Settings className="h-4 w-4 mr-2" />
                        {lang('productMilestones.buttons.bulkBudget')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setTimeout(() => setShowSyncConfirmDialog(true), 0)}
                        disabled={isSyncingFromCompany}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingFromCompany ? 'animate-spin' : ''}`} />
                        {isSyncingFromCompany ? "Syncing..." : "Settings Sync"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setTimeout(() => setShowDependencyDialog(true), 0)}>
                        <Link className="h-4 w-4 mr-2" />
                        {lang('productMilestones.buttons.dependencies')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setTimeout(() => setShowRecalculateDialog(true), 0)}
                        disabled={isReinitializing}
                      >
                        {isReinitializing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                        {lang('productMilestones.buttons.recalculate')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialog open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{lang('productMilestones.recalculateDialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {lang('productMilestones.recalculateDialog.description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recalculate-mode"
                              value="preserve-manual"
                              checked={recalculateMode === 'preserve-manual'}
                              onChange={(e) => setRecalculateMode(e.target.value as 'company-settings' | 'preserve-manual' | 'sync-company')}
                              className="mt-1"
                            />
                            <div>
                              <div className="font-medium">{lang('productMilestones.recalculateDialog.preserveManual')}</div>
                              <div className="text-sm text-muted-foreground">
                                {lang('productMilestones.recalculateDialog.preserveManualDesc')}
                              </div>
                            </div>
                          </label>

                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recalculate-mode"
                              value="company-settings"
                              checked={recalculateMode === 'company-settings'}
                              onChange={(e) => setRecalculateMode(e.target.value as 'company-settings' | 'preserve-manual' | 'sync-company')}
                              className="mt-1"
                            />
                            <div>
                              <div className="font-medium">{lang('productMilestones.recalculateDialog.useCompanySettings')}</div>
                              <div className="text-sm text-muted-foreground">
                                {lang('productMilestones.recalculateDialog.useCompanySettingsDesc')}
                              </div>
                            </div>
                          </label>

                          <label className="flex items-start space-x-3 cursor-pointer border-t pt-3">
                            <input
                              type="radio"
                              name="recalculate-mode"
                              value="sync-company"
                              checked={recalculateMode === 'sync-company'}
                              onChange={(e) => setRecalculateMode(e.target.value as 'company-settings' | 'preserve-manual' | 'sync-company')}
                              className="mt-1"
                            />
                            <div>
                              <div className="font-medium text-amber-600">{lang('productMilestones.recalculateDialog.resetToCompany')}</div>
                              <div className="text-sm text-muted-foreground">
                                {lang('productMilestones.recalculateDialog.resetToCompanyDesc')}
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReinitializeTimeline}>
                          {recalculateMode === 'sync-company'
                            ? lang('productMilestones.recalculateDialog.resetToCompanyAction')
                            : recalculateMode === 'company-settings'
                              ? lang('productMilestones.recalculateDialog.resetWithCompanyAction')
                              : lang('productMilestones.recalculateDialog.preserveRecalculateAction')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => navigate(`/app/product/${productId}/gantt-v2-3`)}
              >
                <BarChart3 className="h-4 w-4" />
                Gantt v2.3
              </Button> */}
                </div>
              </div>

              <TabsContent value="milestones" className="mt-4" data-tour="milestones"> {/* Reduced from mt-6 to mt-4 (-30px spacing) */}
                <div className="space-y-6">
                  <PhaseTimelineManager productId={productId} companyId={product.company_id} product={product} phases={timelinePhases} onPhaseStartDateChange={handlePhaseStartDateChange} onPhaseEndDateChange={handlePhaseEndDateChange} onSetCurrentPhase={handleSetCurrentPhase} onPhaseStatusChange={handlePhaseStatusChange} onPhaseUpdate={handlePhaseUpdateWithScrollPreservation} progress={overallProgress} projectStartDate={timelinePhases.length > 0 ? timelinePhases.filter(phase => phase.startDate).map(phase => phase.startDate!).sort((a, b) => a.getTime() - b.getTime())[0] : undefined} projectedLaunchDate={product?.projected_launch_date ? new Date(product.projected_launch_date) : undefined} />
                </div>
              </TabsContent>


              {/* <TabsContent value="gantt" className="mt-6">
            <GanttChartV2 phases={timelinePhases} productId={productId!} companyId={product?.company_id || ''} product={product} />
          </TabsContent> */}

              <TabsContent value="gantt" className="mt-4">
                {/* <ProductGanttV3Page /> */}
                <ProductGanttV23Page />
              </TabsContent>

              <TabsContent value="costs" className="mt-4">
                <BudgetCostChart productId={productId!} companyId={product?.company_id || ''} />
              </TabsContent>
            </Tabs>

            {/* Bulk Budget Operations Dialog */}
            {showBulkBudget && (
              <BulkBudgetOperationsDialog
                isOpen={showBulkBudget}
                onClose={() => setShowBulkBudget(false)}
                productId={productId!}
                companyId={product?.company_id || ''}
                onComplete={() => {
                  setShowBulkBudget(false);
                  // Refresh timeline data to show updated budgets
                  refetch();
                }}
              />
            )}

            {/* Product Phase Dependencies Dialog */}
            {showDependencyDialog && productId && product?.company_id && (
              <ProductPhaseDependencyDialog
                open={showDependencyDialog}
                onOpenChange={setShowDependencyDialog}
                productId={productId}
                companyId={product.company_id}
                phases={timelinePhases.map(phase => ({
                  id: phase.id,
                  name: phase.name,
                  phase_id: phase.phase_id,
                  position: phase.position
                }))}
                onDependenciesChange={() => {
                  refetchProductDependencies();
                  refetch(); // Also refresh phases to show updated timeline
                }}
              />
            )}

            {/* Sync from Company Confirmation Dialog */}
            <AlertDialog open={showSyncConfirmDialog} onOpenChange={setShowSyncConfirmDialog}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sync with Company Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    {lang('productMilestones.syncDialog.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="sync-mode"
                        value="keep-existing"
                        checked={syncMode === 'keep-existing'}
                        onChange={(e) => setSyncMode(e.target.value as 'full-replace' | 'keep-existing')}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold">{lang('productMilestones.syncDialog.keepExisting')}</div>
                        <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: lang('productMilestones.syncDialog.keepExistingDesc') }} />
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-red-200 hover:bg-red-50/50 transition-colors">
                      <input
                        type="radio"
                        name="sync-mode"
                        value="full-replace"
                        checked={syncMode === 'full-replace'}
                        onChange={(e) => setSyncMode(e.target.value as 'full-replace' | 'keep-existing')}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold">{lang('productMilestones.syncDialog.fullReplace')}</div>
                        <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: lang('productMilestones.syncDialog.fullReplaceDesc') }} />
                      </div>
                    </label>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowSyncConfirmDialog(false);
                      handleSyncFromCompany(syncMode);
                    }}
                    className={syncMode === 'full-replace'
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                  >
                    {syncMode === 'full-replace' ? lang('productMilestones.syncDialog.replaceAll') : lang('productMilestones.syncDialog.syncNow')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <FloatingReturnButton />
      </div>
    </InvestorShareFlowWrapper>
  );
}