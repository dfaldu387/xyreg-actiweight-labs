
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { AlertCircle, ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, GitBranch, Repeat, TrendingUp, Edit, FileText, Search, Activity, ClipboardList, CheckCircle, Microscope, ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { PhaseStatusToggle } from "@/components/product/device/timeline/PhaseStatusToggle";
import { LikelihoodOfApprovalSlider } from "./LikelihoodOfApprovalSlider";
import { EditCIModal } from "./EditCIModal";
import { PhaseBudgetDisplay } from "@/components/budget/PhaseBudgetDisplay";
import { PhaseDocumentCountService, PhaseDocumentCount } from "@/services/phaseDocumentCountService";
import { PhaseMetricsService, PhaseMetricsData } from "@/services/phaseMetricsService";
import { PhaseDocumentDialog } from "./PhaseDocumentDialog";
import { getLegacyTimelineConfig, adjustPhasesForLegacyProduct, getLegacyProductMessage } from "@/utils/legacyTimelineUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from '@/hooks/useTranslation';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface PhaseTimelineManagerProps {
  productId?: string;
  companyId?: string;
  product?: any; // Add product data to enable legacy detection
  phases?: Array<{
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
    position?: number;
    likelihood_of_success?: number;
    typical_start_day?: number;
    typical_duration_days?: number;
    assigned_to?: string | null;
    reviewer_group_id?: string | null;

    phase_id?: string;
  }>;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  onSetCurrentPhase?: (phaseId: string) => void;
  onPhaseStatusChange?: (phaseId: string, status: string) => void;
  onPhaseUpdate?: () => void;

  progress?: number;
  projectStartDate?: Date;
  projectedLaunchDate?: Date;
}

// Interface moved to PhaseMetricsService - using PhaseMetricsData import instead

export function PhaseTimelineManager({
  productId,
  companyId,
  product,
  phases = [],
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  onSetCurrentPhase,
  onPhaseStatusChange,
  onPhaseUpdate,

  progress,
  projectStartDate,
  projectedLaunchDate
}: PhaseTimelineManagerProps) {
  const { lang } = useTranslation();
  const { showPhaseCategories } = useUserPreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<typeof phases[0] | null>(null);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const [phaseMetrics, setPhaseMetrics] = useState<Record<string, PhaseMetricsData>>({});
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
  const [phaseDocumentCounts, setPhaseDocumentCounts] = useState<Record<string, PhaseDocumentCount>>({});
  const [documentCountsLoading, setDocumentCountsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedPhaseForDocuments, setSelectedPhaseForDocuments] = useState<{ id: string; name: string } | null>(null);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const categoriesInitializedRef = useRef(false);
  const [subSectionMap, setSubSectionMap] = useState<Record<string, string>>({});

  // Fetch category names for phases
  useEffect(() => {
    const fetchCategories = async () => {
      if (!companyId || !phases.length) return;

      try {
        // Get unique category IDs from phases
        const categoryIds = phases
          .map(p => (p as any).category_id)
          .filter(Boolean);

        if (categoryIds.length === 0) {
          setCategoryMap({});
          return;
        }

        // Fetch category names
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: categories, error: categoryError } = await supabase
          .from('phase_categories')
          .select('id, name')
          .in('id', categoryIds)
          .eq('company_id', companyId);

        if (categoryError) throw categoryError;

        // Create map of category_id -> category_name
        const map: Record<string, string> = {};
        categories?.forEach(cat => {
          map[cat.id] = cat.name;
        });

        setCategoryMap(map);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [companyId, phases]);

  // Fetch sub-section names for phases
  useEffect(() => {
    const fetchSubSections = async () => {
      if (!companyId || !phases.length) return;

      try {
        const subSectionIds = [...new Set(
          phases
            .map(p => (p as any).sub_section_id)
            .filter(Boolean)
        )];

        if (subSectionIds.length === 0) {
          setSubSectionMap({});
          return;
        }

        const { supabase } = await import('@/integrations/supabase/client');
        const { data: subSections, error: subSectionError } = await supabase
          .from('phase_sub_sections')
          .select('id, name')
          .in('id', subSectionIds);

        if (subSectionError) throw subSectionError;

        const map: Record<string, string> = {};
        subSections?.forEach(ss => {
          map[ss.id] = ss.name;
        });

        setSubSectionMap(map);
      } catch (error) {
        console.error('Error fetching sub-sections:', error);
      }
    };

    fetchSubSections();
  }, [companyId, phases]);

  // All categories and sub-sections start collapsed by default
  // Users can expand them manually by clicking


  // Get legacy timeline configuration
  const legacyConfig = product ? getLegacyTimelineConfig(product) : { isLegacyProduct: false, launchDate: new Date(), shouldShowLegacyIndicator: false };
  const legacyMessage = getLegacyProductMessage(legacyConfig);

  // Adjust phases for legacy products
  const adjustedPhases = legacyConfig.isLegacyProduct
    ? adjustPhasesForLegacyProduct(phases.map(p => ({
      ...p,
      start_date: p.startDate?.toISOString().split('T')[0],
      end_date: p.endDate?.toISOString().split('T')[0],
      product_id: productId || '',
      phase_id: p.phase_id || p.id,
      is_current_phase: p.isCurrentPhase || false,
      status: (p.status as "Not Started" | "In Progress" | "Completed") || "Not Started"
    })), legacyConfig).map(adjustedPhase => ({
      ...adjustedPhase,
      startDate: adjustedPhase.start_date ? new Date(adjustedPhase.start_date) : undefined,
      endDate: adjustedPhase.end_date ? new Date(adjustedPhase.end_date) : undefined,
      isCurrentPhase: adjustedPhase.is_current_phase
    }))
    : phases;
  // Fetch real metrics for each phase based on admin approval status6+
  useEffect(() => {
    const fetchPhaseMetrics = async () => {
      if (!productId || phases.length === 0) {
        return;
      }

      setMetricsLoading(true);
      try {
        // For activities, we need lifecycle_phases.id (p.id), not company_phases.id (p.phase_id)
        // But for gap analysis and audit logs, we need company_phases.id (p.phase_id)
        const lifecyclePhaseIds = phases.map(p => p.id);
        const metricsData = await PhaseMetricsService.getMultiplePhaseMetrics(productId, lifecyclePhaseIds);
        if (metricsData && typeof metricsData === 'object') {
          setPhaseMetrics(metricsData);
        } else {
          console.warn('[PhaseTimelineManager] Metrics payload was empty, defaulting to empty object.');
          setPhaseMetrics({});
        }
      } catch (error) {
        console.error('[PhaseTimelineManager] Error fetching phase metrics:', error);
        // Fallback to empty metrics
        const emptyMetrics: Record<string, PhaseMetricsData> = {};
        phases.forEach(phase => {
          const phaseId = phase.id; // Use lifecycle_phases.id for consistency
          emptyMetrics[phaseId] = {
            documents: { total: 0, completed: 0, percentage: null },
            gapAnalysis: { total: 0, completed: 0, percentage: null },
            activities: { total: 0, completed: 0, percentage: null },
            audits: { total: 0, completed: 0, percentage: null },
            clinical_trials: { total: 0, completed: 0, percentage: null },
            overall: { total: 0, completed: 0, percentage: null }
          };
        });
        setPhaseMetrics(emptyMetrics);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchPhaseMetrics();
  }, [productId, phases, dataRefreshTrigger]);

  // Fetch document counts for phases
  useEffect(() => {
    const fetchDocumentCounts = async () => {
      if (!productId || !companyId || phases.length === 0) return;

      setDocumentCountsLoading(true);
      try {
        const counts = await PhaseDocumentCountService.getPhaseDocumentCounts(productId, companyId);

        // Convert array to record for easy lookup
        const countsRecord: Record<string, PhaseDocumentCount> = {};
        (Array.isArray(counts) ? counts : []).forEach(count => {
          countsRecord[count.phaseId] = count;
        });
        setPhaseDocumentCounts(countsRecord);
      } catch (error) {
        console.error('Error fetching document counts:', error);
      } finally {
        setDocumentCountsLoading(false);
      }
    };

    fetchDocumentCounts();
  }, [productId, companyId, phases, dataRefreshTrigger]);

  const handleEditClick = useCallback((phase: typeof phases[0]) => {
    // Enhance phase data with product and company IDs
    const enhancedPhase = {
      ...phase,
      productId,
      companyId
    };
    setSelectedPhase(enhancedPhase);
    setEditModalOpen(true);
  }, [productId, companyId]);

  const handleCloseModal = useCallback(() => {
    setEditModalOpen(false);
    setSelectedPhase(null);
  }, []);

  const handleSavePhase = useCallback(() => {
    // Trigger data refresh in parent component
    if (onPhaseUpdate) {
      onPhaseUpdate();
    }
    // Trigger budget refresh for all displays
    setBudgetRefreshTrigger(prev => prev + 1);
    setDataRefreshTrigger(prev => prev + 1);
    setEditModalOpen(false);
    setSelectedPhase(null);
  }, [onPhaseUpdate]);

  const handleRefreshData = useCallback(() => {
    setDataRefreshTrigger(prev => prev + 1);
  }, []);

  const handleDocumentCardClick = useCallback((phase: typeof phases[0]) => {
    // For document lookup, we need company_phases.id (phase.phase_id)
    // For component state, we use lifecycle_phases.id (phase.id)
    const phaseId = phase.phase_id || phase.id; // Prefer company_phases.id for document queries
    setSelectedPhaseForDocuments({
      id: phaseId,
      name: phase.name
    });
    setDocumentDialogOpen(true);
  }, []);

  const handleCloseDocumentDialog = useCallback(() => {
    setDocumentDialogOpen(false);
    setSelectedPhaseForDocuments(null);
  }, []);

  const handlePhaseHeaderClick = useCallback((phase: typeof phases[0]) => {
    // Navigate to the detailed view page for this phase
    const currentUrl = window.location.pathname;
    const baseUrl = currentUrl.replace(/\/[^/]*$/, ''); // Remove the last segment (e.g., '/milestones')
    navigate(`${baseUrl}/phase/${phase.id}`);
  }, [navigate]);

  const getStatusIcon = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return <AlertCircle className="h-4 w-4 text-destructive" />;

    switch (status) {
      case 'Completed':
      case 'Closed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'In Progress':
      case 'Open':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return "destructive";

    switch (status) {
      case 'Completed':
      case 'Closed':
        return "default";
      case 'In Progress':
      case 'Open':
        return "secondary";
      default:
        return "outline";
    }
  };

  // Determine the display status based on phase data
  const getDisplayStatus = (phase: typeof phases[0]) => {
    const status = phase.status?.toString().trim() || "";
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "inactive") {
      return "Inactive";
    }

    if (normalizedStatus === "completed" || normalizedStatus === "closed") {
      return normalizedStatus === "completed" ? "Completed" : "Closed";
    }

    if (normalizedStatus === "open" || normalizedStatus === "n/a" || normalizedStatus === "na") {
      return status === "N/A" || normalizedStatus === "na" ? "N/A" : "Open";
    }

    if (phase.startDate && phase.endDate) {
      const now = new Date();
      if (now >= phase.startDate && now <= phase.endDate) {
        if (normalizedStatus !== "closed" && normalizedStatus !== "completed") {
          return "In Progress";
        }
      }
      // If current date is after end date and phase isn't completed, it could be overdue
      if (now > phase.endDate && normalizedStatus !== "completed" && normalizedStatus !== "closed") {
        return "Overdue";
      }
      // If phase has dates but hasn't started yet, show "Scheduled"
      if (now < phase.startDate) {
        return "Scheduled";
      }
    }

    if (phase.isCurrentPhase && normalizedStatus !== "closed" && normalizedStatus !== "completed") {
      return "In Progress";
    }

    // Fall back to original status, but convert "not_started" to better display
    if (normalizedStatus === "not_started" && (phase.startDate || phase.endDate)) {
      return "Scheduled";
    }

    if (normalizedStatus === "not_started" || normalizedStatus === "not started") {
      return "Not Started";
    }
    if (normalizedStatus === "in_progress" || normalizedStatus === "in progress") {
      return "In Progress";
    }

    return status || "Not Started";
  };

  // Determine which phase should be marked as current based on actual status and dates
  const determineCurrentPhase = useMemo(() => {
    const phasesToCheck = legacyConfig.isLegacyProduct ? adjustedPhases : phases;
    const explicitlyCurrent = phasesToCheck.find(p => {
      if (!p.isCurrentPhase) return false;

      const status = p.status?.toString().trim().toLowerCase() || "";
      if (status === "closed" || status === "completed" || status === "inactive") return false;

      const now = new Date();
      if (p.startDate && p.endDate && now >= p.startDate && now <= p.endDate) {
        return true;
      }

      return status === "in progress" || status === "in_progress" || status === "open";
    });
    if (explicitlyCurrent) {
      return explicitlyCurrent.id;
    }

    const now = new Date();
    const inProgressPhase = phasesToCheck.find(p => {
      const status = p.status?.toString().trim().toLowerCase() || "";

      if (status === "closed" || status === "completed") return false;

      if (!p.startDate || !p.endDate) return false;
      if (now < p.startDate || now > p.endDate) return false;

      return status !== "inactive";
    });

    return inProgressPhase?.id || null;
  }, [phases, adjustedPhases, legacyConfig.isLegacyProduct]);

  // Convert status for PhaseStatusToggle component
  const convertToPhaseStatus = (status: string): "Open" | "Closed" | "N/A" => {
    switch (status) {
      case 'Completed':
        return 'Closed';
      case 'In Progress':
        return 'Open';
      case 'Not Started':
        return 'Open';
      case 'N/A':
        return 'N/A';
      default:
        return 'Open';
    }
  };

  // Convert back from PhaseStatusToggle to our status format
  const convertFromPhaseStatus = (status: "Open" | "Closed" | "N/A"): string => {
    switch (status) {
      case 'Closed':
        return 'Completed';
      case 'Open':
        return 'In Progress';
      case 'N/A':
        return 'N/A';
      default:
        return 'In Progress';
    }
  };

  // Calculate duration between start and end dates
  const calculatePhaseDuration = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return "";

    const days = differenceInDays(endDate, startDate);

    if (days < 0) return lang('productMilestones.phaseTimeline.duration.invalidDates');
    if (days === 0) return lang('productMilestones.phaseTimeline.duration.sameDay');
    if (days === 1) return lang('productMilestones.phaseTimeline.duration.oneDay');
    return lang('productMilestones.phaseTimeline.duration.days', { count: days });
  };

  // Calculate development phase duration
  const calculateDevelopmentDuration = (): string => {
    if (!projectStartDate || !projectedLaunchDate) return "";

    const months = differenceInMonths(projectedLaunchDate, projectStartDate);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (months < 0) return lang('productMilestones.phaseTimeline.duration.invalidDates');
    if (months === 0) return lang('productMilestones.phaseTimeline.duration.sameMonth');
    if (months === 1) return lang('productMilestones.phaseTimeline.duration.oneMonth');
    if (months < 12) return lang('productMilestones.phaseTimeline.duration.months', { count: months });

    if (years === 1 && remainingMonths === 0) return lang('productMilestones.phaseTimeline.duration.oneYear');
    if (years === 1) return remainingMonths !== 1
      ? lang('productMilestones.phaseTimeline.duration.oneYearMonthsPlural', { months: remainingMonths })
      : lang('productMilestones.phaseTimeline.duration.oneYearMonths', { months: remainingMonths });
    if (remainingMonths === 0) return lang('productMilestones.phaseTimeline.duration.years', { count: years });
    return remainingMonths !== 1
      ? lang('productMilestones.phaseTimeline.duration.yearsMonthsPlural', { years, months: remainingMonths })
      : lang('productMilestones.phaseTimeline.duration.yearsMonths', { years, months: remainingMonths });
  };

  const isPhaseActiveByDate = (phase: typeof phases[0]) => {
    if (!phase.startDate || !phase.endDate) return false;
    const now = new Date();
    return now >= phase.startDate && now <= phase.endDate;
  };

  const handlePhaseSwitchChange = useCallback(async (phase: typeof phases[0], checked: boolean) => {
    if (!productId || !phase.id) return;

    try {
      const newStatus = checked ? 'In Progress' : 'Inactive';

      // Prepare update object
      const updateData: any = {
        status: newStatus
      };

      // If activating and phase doesn't have dates, set default dates
      if (checked && !phase.startDate && !phase.endDate) {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30); // 30 days from now
        updateData.start_date = today.toISOString().split('T')[0];
        updateData.end_date = endDate.toISOString().split('T')[0];
      }

      // If activating this phase, FIRST deactivate all other phases to avoid constraint violation
      if (checked) {
        // Deactivate all phases first (including this one temporarily)
        const { error: deactivateError } = await supabase
          .from('lifecycle_phases')
          .update({ is_current_phase: false })
          .eq('product_id', productId);

        if (deactivateError) throw deactivateError;

        // Now activate the selected phase
        updateData.is_current_phase = true;
      } else {
        // If deactivating, just set is_current_phase to false
        updateData.is_current_phase = false;
      }

      // Update phase status in Supabase
      const { error } = await supabase
        .from('lifecycle_phases')
        .update(updateData)
        .eq('id', phase.id)
        .eq('product_id', productId);

      if (error) throw error;

      // Update product's current phase
      if (checked) {
        const { error: productError } = await supabase
          .from('products')
          .update({ current_lifecycle_phase: phase.name })
          .eq('id', productId);

        if (productError) throw productError;
      } else {
        // If deactivating, clear product's current phase if this was the current one
        const { data: product } = await supabase
          .from('products')
          .select('current_lifecycle_phase')
          .eq('id', productId)
          .single();

        if (product?.current_lifecycle_phase === phase.name) {
          const { error: clearError } = await supabase
            .from('products')
            .update({ current_lifecycle_phase: null })
            .eq('id', productId);

          if (clearError) throw clearError;
        }
      }

      toast.success(checked ? lang('productMilestones.phaseTimeline.toasts.phaseActivated') : lang('productMilestones.phaseTimeline.toasts.phaseInactive'));

      // Refresh data
      setDataRefreshTrigger(prev => prev + 1);
      if (onPhaseUpdate) {
        onPhaseUpdate();
      }
    } catch (error) {
      console.error('Error updating phase status:', error);
      toast.error(lang('productMilestones.phaseTimeline.toasts.failedUpdateStatus'));
    }
  }, [productId, onPhaseUpdate, lang]);

  // Circular progress component
  const CircularProgress = ({ percentage, size = 40 }: { percentage: number | null; size?: number }) => {
    if (percentage === null) {
      return (
        <div className="relative inline-flex items-center justify-center">
          <div className={`w-${size} h-${size} flex items-center justify-center border-2 border-muted rounded-full`} style={{ width: size, height: size }}>
            <span className="text-xs font-medium text-muted-foreground">-</span>
          </div>
        </div>
      );
    }

    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle (remaining percentage) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-300"
          />
          {/* Progress circle (completed percentage) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-green-600 transition-all duration-300"
          />
        </svg>
        <div className="absolute text-xs font-medium text-gray-700">
          {percentage}%
        </div>
      </div>
    );
  };

  if (!phases || phases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {lang('productMilestones.phaseTimeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {lang('productMilestones.phaseTimeline.noPhases')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {lang('productMilestones.phaseTimeline.noPhasesDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Group phases by category
  const phasesToGroup = legacyConfig.isLegacyProduct ? adjustedPhases : phases;
  const uncategorizedLabel = 'Uncategorized';
  const phasesByCategory = phasesToGroup.reduce((acc, phase) => {
    const categoryId = (phase as any).category_id || 'uncategorized';
    const categoryName = categoryId === 'uncategorized'
      ? uncategorizedLabel
      : (categoryMap[categoryId] || uncategorizedLabel);
    if (!acc[categoryId]) {
      acc[categoryId] = { name: categoryName, phases: [] };
    }
    acc[categoryId].phases.push(phase as any);
    return acc;
  }, {} as Record<string, { name: string; phases: any[] }>);

  // Auto-expand all categories on initial load only
  useEffect(() => {
    if (categoriesInitializedRef.current) return;
    const categoryIds = Object.keys(phasesByCategory);
    if (categoryIds.length > 0) {
      setExpandedCategories(new Set(categoryIds));
      categoriesInitializedRef.current = true;
    }
  }, [phasesByCategory]);

  // Render a single phase card
  const renderPhaseCard = (phase: any, index: number) => {
    const phaseId = phase.id;
    const metrics = phaseMetrics[phaseId];
    const isActuallyCurrentPhase = determineCurrentPhase === phase.id;

    const normalizedStatus = phase.status?.toLowerCase() || '';
    const isAutoActive =
      isPhaseActiveByDate(phase) &&
      normalizedStatus !== 'completed' &&
      normalizedStatus !== 'closed' &&
      normalizedStatus !== 'inactive';
    const isManuallyActive =
      phase.isCurrentPhase && normalizedStatus === 'in progress';
    const isPhaseActive = isAutoActive || isManuallyActive;

    return (
      <div
        key={phase.id}
        className={`relative rounded-lg border transition-colors ${isPhaseActive
          ? 'border-primary bg-muted'
          : 'border-border bg-background'
          }`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditClick(phase)}
          className="absolute top-5 right-3 h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity z-10"
        >
          <Edit className="h-4 w-4" />
        </Button>

        {index < phases.length - 1 && (
          <div className="absolute left-4 bottom-0 w-0.5 h-6 bg-border translate-y-full" />
        )}

        <div
          className="w-full p-4 pr-12 text-left hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => handlePhaseHeaderClick(phase)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0 h-[40px]">
              <div className="flex items-center gap-2 h-full">
                <h4 className="font-medium text-sm">
                  {lang('productMilestones.phaseTimeline.phase')} {index + 1}: {phase.name}
                </h4>
                {isActuallyCurrentPhase && (
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                )}
              </div>

              <div className="flex-1"></div>

              <div className="flex items-center gap-2 capitalize">
                <Badge variant={getStatusVariant(getDisplayStatus(phase), phase.isOverdue)} className="text-xs h-6 flex items-center justify-center">
                  {getStatusIcon(getDisplayStatus(phase), phase.isOverdue)}
                  <span className="ml-1">{getDisplayStatus(phase)}</span>
                </Badge>
                {metrics && (
                  <CircularProgress percentage={metrics.overall.percentage} size={30} />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <PhaseStatusToggle
                status={convertToPhaseStatus(phase.status)}
                onStatusChange={(newStatus) => {
                  const convertedStatus = convertFromPhaseStatus(newStatus);
                  onPhaseStatusChange?.(phaseId, convertedStatus);
                }}
                phaseId={phaseId}
                productId={productId}
              />
            </div>
          </div>
        </div>

        <div className="pb-4">
          <div className="px-4 space-y-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {!(phase as any).is_continuous_process && (phase.typical_start_day !== undefined || phase.typical_duration_days !== undefined) && (
                <span>
                  {lang('productMilestones.phaseTimeline.template')}: {lang('productMilestones.phaseTimeline.day')} {phase.typical_start_day || 0} • {phase.typical_duration_days || 0}d
                </span>
              )}

              {(phase as any).is_continuous_process && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {lang('productMilestones.phaseTimeline.concurrentProcess')}
                </span>
              )}

              <div className="flex items-center gap-2">
                <span>{lang('productMilestones.phaseTimeline.likelihoodOfApproval')}:</span>
                <LikelihoodOfApprovalSlider
                  likelihood={phase.likelihood_of_success || 100}
                  editable={false}
                  size="sm"
                />
              </div>

              {(() => {
                const calculatedDuration = phase.startDate && phase.endDate ?
                  Math.ceil((phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)) :
                  phase.typical_duration_days;
                return (
                  <PhaseBudgetDisplay
                    phaseId={phaseId}
                    phaseDuration={calculatedDuration}
                    size="sm"
                    companyId={companyId || ''}
                    refreshTrigger={budgetRefreshTrigger}
                  />
                );
              })()}
            </div>

            {metrics && (
              <div className="grid grid-cols-5 gap-3">
                <div
                  className="flex flex-col gap-1 p-3 bg-muted/60 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
                  onClick={() => window.location.href = `/app/product/${productId}/documents?phase=${encodeURIComponent(phase.name)}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">{lang('productMilestones.phaseTimeline.documents')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {documentCountsLoading ? lang('productMilestones.phaseTimeline.loading') :
                      phaseDocumentCounts[phaseId] ?
                        `${phaseDocumentCounts[phaseId].approvedDocuments}/${phaseDocumentCounts[phaseId].totalDocuments} (${phaseDocumentCounts[phaseId].completionPercentage}%)` :
                        lang('productMilestones.phaseTimeline.noDocuments')
                    }
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-muted/60 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/app/product/${productId}/gap-analysis`)}>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">{lang('productMilestones.phaseTimeline.gapAnalysis')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metricsLoading ? lang('productMilestones.phaseTimeline.loading') :
                      metrics.gapAnalysis.total === 0 ? lang('productMilestones.phaseTimeline.noItems') :
                        `${metrics.gapAnalysis.completed}/${metrics.gapAnalysis.total} (${metrics.gapAnalysis.percentage}%)`}
                  </div>
                </div>

                <div
                  className="flex flex-col gap-1 p-3 bg-muted/60 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/app/product/${productId}/activities`)}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">{lang('productMilestones.phaseTimeline.activities')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metricsLoading ? lang('productMilestones.phaseTimeline.loading') :
                      metrics.activities.total === 0 ? lang('productMilestones.phaseTimeline.noItems') :
                        `${metrics.activities.completed}/${metrics.activities.total} (${metrics.activities.percentage}%)`}
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-muted/60 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/app/product/${productId}/audits`)}>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">{lang('productMilestones.phaseTimeline.audits')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metricsLoading ? lang('productMilestones.phaseTimeline.loading') :
                      metrics.audits.total === 0 ? lang('productMilestones.phaseTimeline.noItems') :
                        `${metrics.audits.completed}/${metrics.audits.total} (${metrics.audits.percentage}%)`}
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-muted/60 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/app/product/${productId}/clinical-trials`)}>
                  <div className="flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-teal-600" />
                    <span className="font-medium text-sm">Clinical Trials</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metricsLoading ? lang('productMilestones.phaseTimeline.loading') :
                      metrics.clinical_trials.total === 0 ? 'N/A' :
                        `${metrics.clinical_trials.completed}/${metrics.clinical_trials.total} (${metrics.clinical_trials.percentage}%)`}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {phase.startDate ? format(phase.startDate, "MMM dd, yyyy") : lang('productMilestones.phaseTimeline.noStart')}
                  {" - "}
                  {phase.endDate ? format(phase.endDate, "MMM dd, yyyy") : lang('productMilestones.phaseTimeline.noEnd')}
                  {calculatePhaseDuration(phase.startDate, phase.endDate) && (
                    <span className="ml-2 text-xs">
                      ({calculatePhaseDuration(phase.startDate, phase.endDate)})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Switch
                  checked={isPhaseActive}
                  onCheckedChange={(checked) => handlePhaseSwitchChange(phase, checked)}
                />
                <span className="text-xs">
                  {isPhaseActive ? lang('productMilestones.phaseTimeline.activePhase') : lang('productMilestones.phaseTimeline.inactive')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {lang('productMilestones.phaseTimeline.title')}
          </CardTitle>
          <div className="flex items-center gap-3">
            {calculateDevelopmentDuration() && (
              <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                <TrendingUp className="h-3 w-3" />
                {lang('productMilestones.phaseTimeline.development')}: {calculateDevelopmentDuration()}
              </Badge>
            )}
            {progress !== undefined && (
              <Badge variant="outline" className='capitalize'>
                {progress}% {lang('productMilestones.phaseTimeline.complete')}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshData}
              className="h-8 w-8 p-0"
              title={lang('productMilestones.phaseTimeline.refreshData')}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legacy product indicator */}
          {legacyMessage && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {legacyMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Render phases grouped by category */}
          {(() => {
            const categoryEntries = Object.entries(phasesByCategory);
            // If all phases are in a single "uncategorized" bucket, render flat without category wrapper
            const isSingleUncategorized = categoryEntries.length === 1 && 
              (categoryEntries[0][1].name === 'Uncategorized' || categoryEntries[0][0] === 'uncategorized');
            
            if (isSingleUncategorized || !showPhaseCategories) {
              let globalPhaseIndex = 0;
              const allPhases = categoryEntries.flatMap(([, catData]) => catData.phases);
              return (
                <div className="space-y-4">
                  {allPhases.map((phase: any) => renderPhaseCard(phase, globalPhaseIndex++))}
                </div>
              );
            }

            return categoryEntries.map(([categoryId, categoryData]) => {
              const isExpanded = expandedCategories.has(categoryId);
              const phaseList = categoryData.phases;
              let globalPhaseIndex = 0;

              // Calculate global index offset for phases in previous categories
              for (const [prevCatId] of Object.entries(phasesByCategory)) {
                if (prevCatId === categoryId) break;
                globalPhaseIndex += phasesByCategory[prevCatId].phases.length;
              }

              return (
                <div key={categoryId} className="border border-border rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto font-medium hover:bg-muted/50 rounded-none"
                    onClick={() => toggleCategory(categoryId)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-left">{categoryData.name}</span>
                      <Badge variant="secondary" className="ml-2 capitalize border-green-300 text-green-700 bg-green-50">
                        {phaseList.length} {phaseList.length !== 1 ? lang('productMilestones.phaseTimeline.phases') : lang('productMilestones.phaseTimeline.phase')}
                      </Badge>
                    </div>
                  </Button>

                  {/* Phase Rows - flat list */}
                  {isExpanded && (
                    <div className="border-t border-border space-y-4 p-4">
                      {phaseList.map((phase: any) => renderPhaseCard(phase, globalPhaseIndex++))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </CardContent>

      <EditCIModal
        isOpen={editModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePhase}
        ciData={selectedPhase}
      />

      {selectedPhaseForDocuments && (
        <PhaseDocumentDialog
          open={documentDialogOpen}
          onClose={handleCloseDocumentDialog}
          phaseId={selectedPhaseForDocuments.id}
          phaseName={selectedPhaseForDocuments.name}
          productId={productId || ''}
          companyId={companyId || ''}
        />
      )}
    </Card>
  );
}
