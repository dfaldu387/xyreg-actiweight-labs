import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProductNavigationTracker } from '@/components/product/ProductNavigationTracker';
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { Toaster } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { ProductDocumentsSection } from "@/components/product/dashboard/ProductDocumentsSection";
import { ProductAuditsSection } from "@/components/product/dashboard/ProductAuditsSection";
import { BusinessInsightsSection } from "@/components/product/dashboard/BusinessInsightsSection";
import { EnhancedProductStatusSection } from "@/components/product/dashboard/EnhancedProductStatusSection";
import { PhaseTimelineVisualizer } from "@/components/product/device/PhaseTimelineVisualizer";
import { DeviceHelixMap } from "@/components/qmsr/DeviceHelixMap";
// import { PriorityActionsSection } from "@/components/product/dashboard/PriorityActionsSection";
import { UsefulAnalyticsSection } from "@/components/product/dashboard/UsefulAnalyticsSection";
import { QuickNavigationSection } from "@/components/product/dashboard/QuickNavigationSection";
import { CIOperationsPanel } from "@/components/product/CIOperationsPanel";
import { EnhancedProductCreationDialog } from "@/components/product/EnhancedProductCreationDialog";
import { useAuth } from "@/context/AuthContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useProductPhases } from "@/hooks/useProductPhases";
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";
import { DualPhaseGanttChart } from "@/components/product/timeline/DualPhaseGanttChart";
import { DocumentChart } from "@/components/product/documents/DocumentChart";
import { DeviceStatusSummaryCards, type InvestorViewSettings } from "@/components/product/device/status/DeviceStatusSummaryCards";
import { DeviceOverviewHeader } from "@/components/product/device/status/DeviceOverviewHeader";
import { useInvestorShareSettings } from "@/hooks/useInvestorShareSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Target, BarChart3, Search, Filter, X, Eye, EyeOff } from "lucide-react";
import { PhaseDocumentCompletionChart } from "@/components/product/dashboard/PhaseDocumentCompletionChart";
import { differenceInDays } from 'date-fns';
import { mapDBStatusToUI } from "@/utils/statusUtils";
import { useMemo } from 'react';
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { useQuery } from '@tanstack/react-query';
import { useVariationDimensions, ProductVariantOptionEntry } from "@/hooks/useVariationDimensions";


export default function ProductDashboard() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { activeCompanyRole } = useCompanyRole();
  const canManageProduct = hasAdminPrivileges(userRole);
  const { lang } = useTranslation();

  // Sync dashboard tab with URL param for help system context
  const dashboardTab = searchParams.get('dashboardTab') || 'status';
  
  const handleDashboardTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'status') {
      newParams.delete('dashboardTab'); // Clean URL for default tab
    } else {
      newParams.set('dashboardTab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  const {
    data: product,
    isLoading,
    error,
    refetch,
    isFetching
  } = useProductDetails(productId, {
    refetchOnMount: true,
    staleTime: 30000
  });

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);

  const [updating, setUpdating] = useState(false);
  const [lastRefetchTime, setLastRefetchTime] = useState<number>(0);
  const [showVersionCreation, setShowVersionCreation] = useState(false);
  const [hasCheckedArchived, setHasCheckedArchived] = useState(false);
  const [investorPreviewMode, setInvestorPreviewMode] = useState(false);

  // Fetch investor share settings for preview mode
  const { settings: investorSettings } = useInvestorShareSettings(product?.company_id);

  // Fetch phases (read-only for status view)
  const {
    phases,
  } = useProductPhases(productId, product?.company_id, product);

  // Fetch document data for chart
  const { phaseDocuments: lifecyclePhaseDocuments } = usePhaseDocuments(
    product?.company_id || '',
    productId || ''
  );

  // Check if product is archived and redirect
  useEffect(() => {
    const checkArchivedStatus = async () => {
      if (!productId || hasCheckedArchived) return;

      try {
        const { data: archivedProduct, error: archivedError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            is_archived,
            companies!inner(name)
          `)
          .eq('id', productId)
          .single();

        if (archivedError) {
          console.error('Error checking archived status:', archivedError);
          return;
        }

        if (archivedProduct?.is_archived) {
          // console.log('Product is archived, redirecting to company dashboard');
          toast.info(`${archivedProduct.name} has been archived`);
          navigate(`/app/company/${encodeURIComponent(archivedProduct.companies.name)}`);
          return;
        }

        setHasCheckedArchived(true);
      } catch (error) {
        console.error('Error in archived check:', error);
        setHasCheckedArchived(true);
      }
    };

    if (!isLoading && !product && !error) {
      checkArchivedStatus();
    }
  }, [productId, isLoading, product, error, navigate, hasCheckedArchived]);

  // Debounced refetch to prevent excessive calls
  const debouncedRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchTime < 2000) { // 2 second debounce
      // console.log('[ProductDashboard] Refetch debounced');
      return;
    }
    setLastRefetchTime(now);
    refetch();
  }, [refetch, lastRefetchTime]);

  // Effect to refetch data when returning to this page
  useEffect(() => {
    if (productId) {
      // console.log('[ProductDashboard] Product ID changed, refetching data');
      debouncedRefetch();
    }
  }, [productId, debouncedRefetch]);

  const handleArchiveProduct = async () => {
    if (!product || !productId) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) throw error;

      toast.success(lang('productDashboard.deviceArchivedSuccess'));

      // Navigate to company dashboard - product.company is now always a string
      const companyName = product.company;
      if (companyName) {
        navigate(`/app/company/${encodeURIComponent(companyName)}`);
      } else {
        navigate('/app/clients');
      }
    } catch (error) {
      console.error("Error archiving device:", error);
      toast.error(lang('productDashboard.deviceArchiveFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleRefreshData = useCallback(() => {
    toast.info(lang('productDashboard.refreshingDeviceData'));
    debouncedRefetch();
  }, [debouncedRefetch, lang]);


  const handleVersionCreated = (productId: string, projectId?: string) => {
    setShowVersionCreation(false);
    toast.success(lang('productDashboard.versionCreatedSuccess'));
    // Navigate to the new version
    if (projectId) {
      window.location.href = `/app/project/${projectId}`;
    } else {
      window.location.href = `/app/product/${productId}`;
    }
  };

  // Calculate days to finish project
  const calculateDaysToFinish = () => {
    if (!phases || phases.length === 0) return null;

    // Find the latest end date among all phases
    const phasesWithEndDates = phases.filter(p => p.end_date);
    if (phasesWithEndDates.length === 0) return null;

    const latestEndDate = new Date(Math.max(...phasesWithEndDates.map(p => new Date(p.end_date!)?.getTime())));
    const today = new Date();
    const daysRemaining = differenceInDays(latestEndDate, today);

    return {
      days: daysRemaining,
      isOverdue: daysRemaining < 0,
      endDate: latestEndDate
    };
  };

  // Calculate days overdue
  const calculateDaysOverdue = () => {
    if (!phases || phases.length === 0) return 0;

    const today = new Date();
    let maxDaysOverdue = 0;

    phases.forEach(phase => {
      if (phase.is_overdue && phase.end_date) {
        const endDate = new Date(phase.end_date);
        const daysOverdue = Math.abs(differenceInDays(today, endDate));
        maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);
      }
    });

    return maxDaysOverdue;
  };

  // Calculate stats
  const totalPhases = phases?.length || 0;
  const completedPhases = phases?.filter(p => p.status === 'Completed').length || 0;
  const overduePhases = phases?.filter(p => p.is_overdue).length || 0;
  const daysToFinish = calculateDaysToFinish();
  const daysOverdue = calculateDaysOverdue();
  const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // Transform phases for Gantt chart
  const timelinePhases = phases?.map(phase => ({
    id: phase.id,
    name: phase.name,
    startDate: phase.start_date ? new Date(phase.start_date) : undefined,
    endDate: phase.end_date ? new Date(phase.end_date) : undefined,
    status: phase.status || 'Not Started',
    isCurrentPhase: phase.is_current_phase || phase.isCurrentPhase || false,
    isOverdue: phase.is_overdue || false,
    position: phase.position,
    likelihood_of_success: phase.likelihood_of_success,
    start_date: phase.start_date,
    duration_days: phase.duration_days,
    is_continuous_process: phase.is_continuous_process,
    phase_id: phase.phase_id,
    is_pre_launch: true // Default all phases to pre-launch until proper launch status tracking
  })) || [];

  // Prepare chart data for documents
  const documentChartData = useMemo(() => {
    // Helper function to normalize phase names for comparison
    const normalizePhaseName = (name: string) => name.trim().toLowerCase();

    // ===== COMPREHENSIVE DEBUGGING LOGS =====
    // console.group('[DocumentChart DEBUG] Phase Matching Analysis');

    // Log all phases from phases array
    // console.log('📊 PHASES ARRAY (from useProductPhases):', phases.length, 'total');
    // phases.forEach((phase, idx) => {
    //   console.log(`  ${idx + 1}. RAW: "${phase.name}" | NORMALIZED: "${normalizePhaseName(phase.name)}" | STATUS: ${phase.status} | IS_CURRENT: ${phase.is_current_phase || phase.isCurrentPhase}`);
    // });

    // Log all phase names from lifecyclePhaseDocuments
    const phaseKeysFromDocs = Object.keys(lifecyclePhaseDocuments);
    // console.log('\n📄 LIFECYCLE PHASE DOCUMENTS KEYS:', phaseKeysFromDocs.length, 'total');
    phaseKeysFromDocs.forEach((phaseName, idx) => {
      const docCount = lifecyclePhaseDocuments[phaseName]?.length || 0;
      // console.log(`  ${idx + 1}. RAW: "${phaseName}" | NORMALIZED: "${normalizePhaseName(phaseName)}" | DOCS: ${docCount}`);
    });

    // Create phase position lookup from phases data
    const phasePositionMap = new Map<string, number>();
    const activePhases = new Set<string>();

    phases.forEach(phase => {
      const normalizedPhase = normalizePhaseName(phase.name);
      phasePositionMap.set(normalizedPhase, phase.position || 0);
      // Track which phases are currently active (Open or In Progress)
      if (phase.is_current_phase || phase.isCurrentPhase ||
        phase.status === 'Open' || phase.status === 'In Progress' ||
        phase.status === 'Scheduled') {
        const normalized = normalizePhaseName(phase.name);
        activePhases.add(normalized);
      }
    });

    // console.log('\n✅ ACTIVE PHASES (should be BLUE):', Array.from(activePhases));
    // console.log('Total active phases:', activePhases.size);

    // Log matching results
    // console.log('\n🔍 MATCHING RESULTS:');
    phaseKeysFromDocs.forEach(phaseName => {
      const normalized = normalizePhaseName(phaseName);
      const isMatched = activePhases.has(normalized);
      // console.log(`  "${phaseName}" → normalized: "${normalized}" → MATCH: ${isMatched ? '✅ YES (will be BLUE)' : '❌ NO (will be GREY)'}`);
    });

    console.groupEnd();
    // ===== END DEBUGGING LOGS =====

    // Get all documents including those not assigned to phases
    const allDocumentsFlat = Object.values(lifecyclePhaseDocuments).flat() as any[];

    // Find core documents (those with document_type 'Core' or no phase assignment)
    const coreDocuments = allDocumentsFlat.filter(doc =>
      doc.document_type === 'Core' || (!doc.phase_id && doc.document_type !== 'Standard')
    );

    // Create chart data array starting with Core Documents
    const chartData = [];

    // Add Core Documents as first entry if any exist
    if (coreDocuments.length > 0) {
      const coreStatusCounts = coreDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const status = doc.status || doc.document_status;
        const dueDate = doc.dueDate || doc.due_date || doc.deadline;

        // Determine the correct category
        let category = '';

        if (status === 'Completed' || status === 'Approved') {
          category = 'approved';
        } else {
          // For ALL non-completed documents, check if overdue
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            dueDateObj.setHours(23, 59, 59, 999); // End of due date

            if (dueDateObj < today) {
              category = 'overdue';
            } else {
              category = 'pending';
            }
          } else {
            // No due date = pending
            category = 'pending';
          }
        }

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      chartData.push({
        phase: 'Core Documents',
        approved: coreStatusCounts['approved'] || 0,
        active: 0, // Core documents don't have active status
        pending: coreStatusCounts['pending'] || 0,
        overdue: coreStatusCounts['overdue'] || 0,
        total: coreDocuments.length,
        position: -1 // Ensure Core Documents appears first
      });
    }

    // Add phase-specific documents (excluding core documents already counted)
    // Filter out "No Phase" entries from the chart
    const phaseChartData = Object.entries(lifecyclePhaseDocuments)
    .filter(([phaseName]) => phaseName.toLowerCase() !== 'no phase')
    .map(([phaseName, documents]) => {
      // Filter out core documents from phase documents to avoid double counting
      const phaseSpecificDocuments = (documents as any[]).filter(doc =>
        doc.document_type !== 'Core' && doc.phase_id
      );

      if (phaseSpecificDocuments.length === 0) return null;

      const normalizedPhaseName = normalizePhaseName(phaseName);
      const isActivePhase = activePhases.has(normalizedPhaseName);
      const matchedPhase = phases.find(
        (phase) => normalizePhaseName(phase.name) === normalizedPhaseName
      );
      const isPhaseComplete = matchedPhase ? matchedPhase.status === 'Completed' : false;
      // console.log('[DocumentChart] Processing phase:', phaseName, '(normalized:', normalizedPhaseName, ') isActive:', isActivePhase, 'docCount:', phaseSpecificDocuments.length);

      // Count documents by actual status considering due dates
      const statusCounts = phaseSpecificDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const status = doc.status || doc.document_status;
        const dueDate = doc.dueDate || doc.due_date || doc.deadline;

        // Determine the correct category
        let category = '';

        if (status === 'Completed' || status === 'Approved') {
          category = 'approved';
        } else if (isActivePhase) {
          // Documents in active phases are categorized as "active" instead of "pending"
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            dueDateObj.setHours(23, 59, 59, 999);

            if (dueDateObj < today) {
              category = 'overdue';
            } else {
              category = 'active'; // Active phase documents that aren't complete/overdue
            }
          } else {
            category = 'active'; // Active phase documents without due date
          }
        } else {
          // For non-active phases, check if overdue
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            dueDateObj.setHours(23, 59, 59, 999); // End of due date

            if (dueDateObj < today) {
              category = 'overdue';
            } else {
              category = 'pending';
            }
          } else {
            // No due date = pending
            category = 'pending';
          }
        }

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      return {
        phase: phaseName,
        approved: statusCounts['approved'] || 0,
        active: statusCounts['active'] || 0,
        pending: statusCounts['pending'] || 0,
        overdue: statusCounts['overdue'] || 0,
        total: phaseSpecificDocuments.length,
        position: phasePositionMap.get(normalizedPhaseName) ?? 999, // Put unknown phases at end
        isActivePhase,
        isPhaseComplete
      };
    }).filter(item => item !== null && item.total > 0); // Only show phases with documents

    // Combine core documents and phase documents, then sort
    const combinedData = [...chartData, ...phaseChartData];

    // Sort by phase position (chronological order, with Core Documents first)
    return combinedData.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      // Fallback to alphabetical sorting for phases with same position
      return a.phase.localeCompare(b.phase);
    });
  }, [lifecyclePhaseDocuments, phases]);

  // Calculate overall document totals like the documents page
  const overallDocumentStats = useMemo(() => {
    const allDocuments = Object.values(lifecyclePhaseDocuments).flat();
    const activePhases = new Set<string>();
    phases.forEach(phase => {
      // Track which phases are currently active (Open or In Progress)
      if (phase.is_current_phase || phase.isCurrentPhase ||
        phase.status === 'Open' || phase.status === 'In Progress' ||
        phase.status === 'Scheduled') {
        activePhases.add(phase.name);
      }
    });

    const stats = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
      const status = doc.status || doc.document_status;
      const dueDate = doc.dueDate || doc.due_date || doc.deadline;
      const docPhaseName = doc.phase_name || doc.lifecycle_phase;
      const isInActivePhase = docPhaseName && activePhases.has(docPhaseName);

      // Determine the correct category
      let category = '';

      if (status === 'Completed' || status === 'Approved') {
        category = 'approved';
      } else if (isInActivePhase) {
        // Documents in active phases
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (dueDate) {
          const dueDateObj = new Date(dueDate);
          dueDateObj.setHours(23, 59, 59, 999);

          if (dueDateObj < today) {
            category = 'overdue';
          } else {
            category = 'active';
          }
        } else {
          category = 'active';
        }
      } else {
        // For ALL non-completed documents, check if overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        if (dueDate) {
          const dueDateObj = new Date(dueDate);
          dueDateObj.setHours(23, 59, 59, 999); // End of due date

          if (dueDateObj < today) {
            category = 'overdue';
          } else {
            category = 'pending';
          }
        } else {
          // No due date = pending
          category = 'pending';
        }
      }

      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = allDocuments.length;
    const approved = stats['approved'] || 0;
    const active = stats['active'] || 0;
    const pending = stats['pending'] || 0;
    const overdue = stats['overdue'] || 0;

    return {
      completionPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      approved,
      active,
      pending,
      overdue
    };
  }, [lifecyclePhaseDocuments, phases]);

  // Calculate market status for badges - MUST be called before any conditional returns
  const marketStatus = useProductMarketStatus(product?.markets);

  const { data: familyDevices, isLoading: isLoadingFamilyDevices } = useQuery({
    queryKey: ['family-devices', product?.company_id, product?.basic_udi_di, product?.id, product?.parent_product_id],
    enabled: !!product?.company_id && !product?.parent_product_id && (!!product?.basic_udi_di || true),
    queryFn: async () => {
      if (!product?.company_id) return [];
      
      // Only fetch family devices for parent products (not child/variant devices)
      if (product.parent_product_id) {
        return [];
      }

      if (product.basic_udi_di) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, trade_name, status, current_lifecycle_phase, updated_at, actual_launch_date, projected_launch_date, udi_di, basic_udi_di, parent_product_id, inserted_at, variant_tags')
          .eq('company_id', product.company_id)
          .eq('basic_udi_di', product.basic_udi_di)
          .eq('is_archived', false)
          .order('inserted_at', { ascending: true });
        if (error) {
          console.error('[ProductDashboard] Failed to fetch family devices by basic UDI', error);
          return [];
        }
        return data || [];
      }
      // Fallback: fetch by parent_product_id relationship
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status, current_lifecycle_phase, updated_at, actual_launch_date, projected_launch_date, udi_di, basic_udi_di, parent_product_id, inserted_at')
        .eq('company_id', product.company_id)
        .eq('is_archived', false)
        .or(`id.eq.${product.id},parent_product_id.eq.${product.id}`)
        .order('inserted_at', { ascending: true });
      if (error) {
        console.error('[ProductDashboard] Failed to fetch parent/variant devices', error);
        return [];
      }
      return data || [];
    }
  });

  // const shouldShowFamilyDashboard = useMemo(() => {
  //   // Never show family dashboard for child/variant devices
  //   if (!product) return false;
  //   if (product.parent_product_id) return false;
    
  //   // Only show family dashboard if there are multiple devices in the family
  //   if (!familyDevices || familyDevices.length <= 1) return false;
    
  //   // For devices without parent_product_id but sharing basic_udi_di:
  //   // Only show family dashboard if this is the "main" device (first created)
  //   // This allows individual device dashboards for non-main devices in the family
  //   if (product.basic_udi_di && !product.parent_product_id) {
  //     // Sort family devices by inserted_at to find the main device (first created)
  //     const sortedDevices = [...familyDevices].sort((a, b) => {
  //       const dateA = a.inserted_at ? new Date(a.inserted_at).getTime() : 0;
  //       const dateB = b.inserted_at ? new Date(b.inserted_at).getTime() : 0;
  //       return dateA - dateB;
  //     });
      
  //     const mainDevice = sortedDevices[0];
  //     // Only show family dashboard if current product is the main device
  //     if (mainDevice && mainDevice.id !== product.id) { 
  //       return false; // Show individual dashboard for non-main devices
  //     }
  //   }
    
  //   return true;
  // }, [product, familyDevices]);

  // CRITICAL: Conditional returns AFTER all hooks are called
  // Don't show full loading screen - show dashboard with loading state instead

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-500">{lang('productDashboard.errorLoadingProduct')}</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show loading state only if product is null during initial load
  // Once product exists, show dashboard with PriorityActionsSection even if still loading
  if (isLoading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('productDashboard.loadingDeviceDashboard')}</p>
        </div>
      </div>
    );
  }

  // Only show "not found" if we're done loading and product is still null
  if (!product && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('productDashboard.deviceNotFound')}</h2>
          <p className="text-muted-foreground">{lang('productDashboard.deviceNotFoundDescription')}</p>
        </div>
      </div>
    );
  }

  // if (product && shouldShowFamilyDashboard) {
  //   return (
  //     <>
  //       <ProductNavigationTracker />
  //       <div className="flex h-full min-h-0 flex-col">
  //         <ProductPageHeader
  //           product={product}
  //           subsection="Device Family Overview"
  //           onRefresh={handleRefreshData}
  //           isRefreshing={isFetching && !isLoading}
  //           onArchive={handleArchiveProduct}
  //           marketStatus={marketStatus}
  //         />
  //         <div className="flex-1 overflow-y-auto">
  //           <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
  //             {isLoadingFamilyDevices ? (
  //               <div className="flex items-center justify-center min-h-[400px]">
  //                 <div className="text-center space-y-4">
  //                   <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
  //                   <p className="text-muted-foreground">Loading device family...</p>
  //                 </div>
  //               </div>
  //             ) : (
  //               <FamilyDeviceDashboard product={product} familyDevices={familyDevices || []} />
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //       <Toaster richColors expand={false} />
  //     </>
  //   );
  // }

  return (
    <>
      <ProductNavigationTracker />
      <div className="flex h-full min-h-0 flex-col">
        <ProductPageHeader
          product={product}
          subsection="Device Dashboard"
          onRefresh={handleRefreshData}
          isRefreshing={isFetching && !isLoading}
          marketStatus={marketStatus}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 py-2 sm:py-3 lg:py-4">
            {isLoading ? (
              // Show loading skeleton while data is being fetched
              <div className="space-y-4 animate-pulse">
                {/* Skeleton for status cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 rounded-2xl bg-muted" />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 rounded-2xl bg-muted" />
                  ))}
                </div>
                {/* Skeleton for timeline */}
                <div className="h-32 rounded-2xl bg-muted" />
              </div>
            ) : (
              <>
                {/* Dashboard Tabs - Device Status & Device Process Engine */}
                <Tabs value={dashboardTab} onValueChange={handleDashboardTabChange} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="status">
                        {lang('deviceProcessEngine.deviceStatusTab')}
                      </TabsTrigger>
                      <TabsTrigger value="process-engine">
                        {lang('deviceProcessEngine.processEngineTab')}
                      </TabsTrigger>
                    </TabsList>
                    <Button
                      variant={investorPreviewMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInvestorPreviewMode(!investorPreviewMode)}
                      className="gap-2"
                    >
                      {investorPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {investorPreviewMode ? lang('productDashboard.exitInvestorPreview') : lang('productDashboard.previewAsInvestor')}
                    </Button>
                  </div>

                  {/* Tab 1: Device Status - Overview and all details */}
                  <TabsContent value="status" className="mt-2 space-y-4 sm:space-y-6">

                    {/* Investor Preview Banner */}
                    {investorPreviewMode && (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800 p-4">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                          <Eye className="h-5 w-5" />
                          <span className="font-medium">{lang('productDashboard.investorPreviewMode')}</span>
                          <span className="text-sm text-indigo-600 dark:text-indigo-400">{lang('productDashboard.investorPreviewDescription')}</span>
                        </div>
                      </div>
                    )}

                    {/* Device Overview Header */}
                    <DeviceOverviewHeader 
                      product={product} 
                      currentPhase={product.current_lifecycle_phase || ''} 
                    />

                    {/* Device Status Summary Cards */}
                    <DeviceStatusSummaryCards
                      product={product}
                      productId={product.id}
                      companyId={product.company_id}
                      mode={investorPreviewMode ? 'investor' : 'company'}
                      isProductLoading={isLoading || isFetching}
                      shareSettings={investorPreviewMode ? {
                        show_phases: true,
                        show_completion: true,
                        show_days_to_finish: true,
                        show_overdue: true,
                        show_burn_rate: investorSettings?.show_burn_rate ?? false,
                        show_clinical_enrollment: investorSettings?.show_clinical_enrollment ?? true,
                        show_regulatory_status_map: investorSettings?.show_regulatory_status_map ?? true,
                        show_rnpv: investorSettings?.show_rnpv ?? false,
                      } : undefined}
                    />

                    {/* Enhanced Lifecycle Phase Timeline */}
                    {phases && phases.length > 0 && (
                      <PhaseTimelineVisualizer
                        phases={phases}
                        currentPhase={product.current_lifecycle_phase || ''}
                        productId={product.id}
                        onPhaseChange={handleRefreshData}
                      />
                    )}

                    {/* Document Status & My Action Center */}
                    {documentChartData.length > 0 ? (
                      <div className="grid gap-4 xl:grid-cols-1">
                        <Card className="xl:col-span-2 h-full">
                          <CardHeader className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <CardTitle className="flex items-center gap-2 text-xl">
                                <BarChart3 className="h-5 w-5" />
                                {lang('productDashboard.documentStatusByPhase')}
                              </CardTitle>
                              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                {overallDocumentStats.completionPercentage}% {lang('productDashboard.complete')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center">
                                <p className="text-xs uppercase text-green-700 tracking-wide">{lang('productDashboard.approved')}</p>
                                <p className="text-2xl font-bold text-green-600">{overallDocumentStats.approved}</p>
                              </div>
                              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                                <p className="text-xs uppercase text-blue-700 tracking-wide">{lang('productDashboard.active')}</p>
                                <p className="text-2xl font-bold text-blue-600">{overallDocumentStats.active}</p>
                              </div>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                <p className="text-xs uppercase text-slate-600 tracking-wide">{lang('productDashboard.pending')}</p>
                                <p className="text-2xl font-bold text-slate-600">{overallDocumentStats.pending}</p>
                              </div>
                              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center">
                                <p className="text-xs uppercase text-rose-600 tracking-wide">{lang('productDashboard.overdue')}</p>
                                <p className="text-2xl font-bold text-rose-500">{overallDocumentStats.overdue}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <DocumentChart
                              data={documentChartData}
                              onSegmentClick={(phase, status) => {
                                navigate(`/app/product/${productId}/documents?phase=${encodeURIComponent(phase)}`);
                              }}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    ) : null}

                    <BusinessInsightsSection product={product} />
                    <EnhancedProductStatusSection product={product} />
                    <CIOperationsPanel productId={product.id} companyId={product.company_id} />
                    <ProductDocumentsSection product={product} />
                    <UsefulAnalyticsSection product={product} />
                    <QuickNavigationSection product={product} />
                    <ProductAuditsSection product={product} />

                    {/* Gantt Chart Timeline - Moved to bottom */}
                    <DualPhaseGanttChart
                      phases={timelinePhases}
                      product={product}
                      progress={overallProgress}
                      projectedLaunchDate={product?.projected_launch_date ? new Date(product.projected_launch_date) : undefined}
                      actualLaunchDate={(product as any)?.actual_launch_date ? new Date((product as any).actual_launch_date) : undefined}
                      isReadOnly={true}
                    />
                  </TabsContent>

                  {/* Tab 2: Device Process Engine - QMS Map */}
                  <TabsContent value="process-engine" className="mt-6">
                    <DeviceHelixMap 
                      productId={product.id}
                      productName={product.name}
                      companyId={product.company_id}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>

        {/* Version Creation Dialog */}
        <EnhancedProductCreationDialog
          open={showVersionCreation}
          onOpenChange={setShowVersionCreation}
          companyId={product.company_id}
          onProductCreated={handleVersionCreated}
        />

        <Toaster position="top-center" />
      </div>
    </>
  );
}

function FamilyDeviceDashboard({ product, familyDevices }: { product: any; familyDevices: any[] }) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [variantOptionFilter, setVariantOptionFilter] = useState<string | null>(null);
  
  const statusCategory = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('launch') || normalized.includes('market')) return 'launched';
    if (normalized.includes('concept')) return 'concept';
    if (normalized.includes('regulatory')) return 'regulatory';
    if (normalized.includes('retire') || normalized.includes('inactive')) return 'retired';
    if (normalized.includes('v&v') || normalized.includes('validation')) return 'designvv';
    return 'development';
  };
  const portfolioCounts = familyDevices.reduce(
    (acc, device) => {
      const category = statusCategory(device.status);
      acc.total += 1;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    { total: 0, launched: 0, development: 0, concept: 0, regulatory: 0, designvv: 0, retired: 0 } as Record<string, number>
  );

  const actionItems = familyDevices.filter((device) => {
    const normalized = (device.status || '').toLowerCase();
    return normalized.includes('overdue') || normalized.includes('hold') || normalized.includes('risk');
  }).length;

  const getVariantType = useCallback((device: any) => {
    if (device.id === product.id) return lang('productDashboard.familyDashboard.main');
    if (device.parent_product_id === product.id) return lang('productDashboard.familyDashboard.variant');
    if (device.parent_product_id && device.parent_product_id !== product.id) return lang('productDashboard.familyDashboard.variant');
    return lang('productDashboard.familyDashboard.main');
  }, [product.id, lang]);
  const familyDeviceIds = useMemo(
    () => familyDevices.map((device) => device.id).filter((id): id is string => Boolean(id)),
    [familyDevices]
  );
  const {
    dimensions: variantDimensions,
    productVariantOptions
  } = useVariationDimensions(product?.company_id, { productIds: familyDeviceIds });
  const filteredVariantRows = useMemo(() => {
    // Exclude the current device from the list
    let filtered = familyDevices.filter((device) => device.id !== product.id);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((device) => {
        const name = (device.trade_name || device.name || '').toLowerCase();
        const udiDi = (device.udi_di || '').toLowerCase();
        return name.includes(query) || udiDi.includes(query);
      });
    }

    // Apply variant option filter
    if (variantOptionFilter) {
      filtered = filtered.filter((device) => {
        const options = productVariantOptions?.[device.id] || [];
        // Check if any option matches the filter (format: "dimensionId:optionId" or "dimensionName:optionName")
        return options.some((option) => {
          const optionKey = `${option.dimensionId}:${option.optionId || ''}`;
          const optionNameKey = `${option.dimensionName || ''}:${option.optionName || option.valueText || ''}`;
          return optionKey === variantOptionFilter || optionNameKey === variantOptionFilter;
        });
      });
    }

    // Sort by variant type
    return filtered.sort((a, b) => getVariantType(a).localeCompare(getVariantType(b)));
  }, [familyDevices, product.id, searchQuery, variantOptionFilter, productVariantOptions, getVariantType]);

  const variantRows = filteredVariantRows;

  const pipelineSegments = [
    { label: lang('productDashboard.familyDashboard.concept'), value: portfolioCounts.concept || 0, color: '#1D4ED8' },
    { label: lang('productDashboard.familyDashboard.designVV'), value: portfolioCounts.designvv || 0, color: '#2563EB' },
    { label: lang('productDashboard.familyDashboard.regulatory'), value: portfolioCounts.regulatory || 0, color: '#0EA5E9' },
    { label: lang('productDashboard.familyDashboard.inDevelopment'), value: portfolioCounts.development || 0, color: '#22C55E' },
    { label: lang('productDashboard.familyDashboard.launched'), value: portfolioCounts.launched || 0, color: '#0F9D58' },
  ];

  const pipelineTotal = pipelineSegments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{lang('productDashboard.familyDashboard.clientCompassFamily')}</p>
            <h2 className="text-3xl font-bold mt-1">{product?.name || lang('productDashboard.familyDashboard.deviceFamilyOverview')}</h2>
            <p className="text-muted-foreground text-sm">{lang('productDashboard.familyDashboard.family')} {product?.basic_udi_di || 'Unassigned'} • {lang('productDashboard.familyDashboard.totalVariants')} {familyDevices.length}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
            <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] shadow-lg">
              <p className="text-xs uppercase tracking-wide">{lang('productDashboard.familyDashboard.familyPortfolioStatus')}</p>
              <div className="text-4xl font-bold mt-2">{portfolioCounts.total}</div>
              <ul className="mt-3 space-y-1 text-sm text-white/90">
                <li>• {portfolioCounts.launched} {lang('productDashboard.familyDashboard.launched')}</li>
                <li>• {portfolioCounts.development} {lang('productDashboard.familyDashboard.inDevelopment')}</li>
                <li>• {portfolioCounts.retired} {lang('productDashboard.familyDashboard.retired')}</li>
              </ul>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0F9D58] to-[#22C55E] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">{lang('productDashboard.familyDashboard.pipelineHealth')}</p>
              <div className="text-2xl font-semibold mt-2">
                {lang('productDashboard.familyDashboard.activeDevelopment')} {portfolioCounts.development}
              </div>
              <p className="text-sm text-white/80 mt-1">
                {portfolioCounts.development} {lang('productDashboard.familyDashboard.variantsApproachingGates')}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.min(100, (portfolioCounts.development / portfolioCounts.total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#312E81] to-[#4338CA] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">{lang('productDashboard.familyDashboard.postMarketCompliance')}</p>
              <div className="text-2xl font-semibold mt-2">{portfolioCounts.launched} {lang('productDashboard.familyDashboard.onMarket')}</div>
              <p className="text-sm text-white/80 mt-1">
                {actionItems} {lang('productDashboard.familyDashboard.capasNoCriticalHolds')}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">{lang('productDashboard.familyDashboard.familyActionItems')}</p>
              <div className="text-2xl font-semibold mt-2">{actionItems}</div>
              <p className="text-sm text-white/80 mt-1">{lang('productDashboard.familyDashboard.requireImmediateFollowup')}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{lang('productDashboard.familyDashboard.familyPipelineDistribution')}</h3>
                <p className="text-sm text-muted-foreground">{lang('productDashboard.familyDashboard.acrossAllVariants')}</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {pipelineTotal} {lang('productDashboard.familyDashboard.total')}
              </Badge>
            </div>
            <div className="flex items-stretch rounded-xl overflow-hidden border">
              {pipelineSegments.map((segment) => (
                <div
                  key={segment.label}
                  className="h-10 flex items-center justify-center text-xs font-semibold text-white"
                  style={{
                    width: `${(segment.value / pipelineTotal) * 100}%`,
                    backgroundColor: segment.color
                  }}
                >
                  {segment.value > 0 && (
                    <span className="px-2 text-white/90">
                      {segment.label} ({segment.value})
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {pipelineSegments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{lang('productDashboard.familyDashboard.detailedVariantList')}</h3>
                <p className="text-sm text-muted-foreground">{lang('productDashboard.familyDashboard.allVariantsSharingBasicUDI')} {product?.basic_udi_di}</p>
              </div>
              <Badge variant="secondary">{lang('productDashboard.familyDashboard.mainDeviceSelected')}</Badge>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={lang('productDashboard.familyDashboard.searchVariantsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {lang('productDashboard.familyDashboard.variantOptions')}
                    {variantOptionFilter && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                  <DropdownMenuLabel>{lang('productDashboard.familyDashboard.filterByVariantOption')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setVariantOptionFilter(null)}
                    className={!variantOptionFilter ? 'bg-accent' : ''}
                  >
                    {lang('productDashboard.familyDashboard.allOptions')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {(() => {
                    // Collect all unique variant options from all devices
                    const allOptions = new Map<string, { dimensionName: string; optionName: string; key: string }>();
                    
                    familyDeviceIds.forEach((deviceId) => {
                      const options = productVariantOptions?.[deviceId] || [];
                      options.forEach((option) => {
                        const dimensionName = option.dimensionName || 'Unknown';
                        const optionName = option.optionName || option.valueText || 'Unknown';
                        const key = `${option.dimensionId}:${option.optionId || ''}`;
                        const displayKey = `${dimensionName}: ${optionName}`;
                        
                        if (!allOptions.has(key)) {
                          allOptions.set(key, { dimensionName, optionName, key });
                        }
                      });
                    });
                    
                    // Group by dimension
                    const groupedByDimension = new Map<string, Array<{ dimensionName: string; optionName: string; key: string }>>();
                    allOptions.forEach((option) => {
                      if (!groupedByDimension.has(option.dimensionName)) {
                        groupedByDimension.set(option.dimensionName, []);
                      }
                      groupedByDimension.get(option.dimensionName)!.push(option);
                    });
                    
                    return Array.from(groupedByDimension.entries()).map(([dimensionName, options]) => (
                      <div key={dimensionName}>
                        <DropdownMenuLabel className="text-xs text-muted-foreground mt-2">
                          {dimensionName}
                        </DropdownMenuLabel>
                        {options.map((option) => {
                          const optionKey = option.key;
                          const displayText = option.optionName;
                          return (
                            <DropdownMenuItem
                              key={optionKey}
                              onClick={() => setVariantOptionFilter(variantOptionFilter === optionKey ? null : optionKey)}
                              className={variantOptionFilter === optionKey ? 'bg-accent' : ''}
                            >
                              {displayText}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    ));
                  })()}
                  
                  {variantOptionFilter && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setVariantOptionFilter(null)}
                        className="text-red-600"
                      >
                        {lang('productDashboard.familyDashboard.clearFilter')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.deviceNameSKU')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.variantType')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.variantOptions')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.currentPhase')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.statusTag')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.healthActions')}</th>
                    <th className="pb-3">{lang('productDashboard.familyDashboard.tableHeaders.lastUpdated')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variantRows.map((device) => {
                    const statusLabel = String(mapDBStatusToUI(device.status || 'Not Started'));
                    const updatedAt = device.updated_at
                      ? new Date(device.updated_at).toLocaleDateString()
                      : '—';
                    const deviceUrl = `/app/product/${device.id}`;
                    return (
                      <tr
                        key={device.id}
                        onClick={() => navigate(deviceUrl)}
                        className="group cursor-pointer transition-all bg-transparent hover:bg-blue-50/40"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(deviceUrl);
                          }
                        }}
                      >
                        <td className="py-3 font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-blue-700 group-hover:underline transition-colors">
                                {device.trade_name || device.name || lang('productDashboard.familyDashboard.unnamedDevice')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{device.udi_di || lang('productDashboard.familyDashboard.noUDIDI')}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground group-hover:text-blue-700 transition-colors">
                          {getVariantType(device)}
                        </td>
                        <td className="py-3">
                          <VariantOptionBadges
                            deviceId={device.id}
                            variantDimensions={variantDimensions}
                            productVariantOptions={productVariantOptions}
                          />
                        </td>
                        <td className="py-3 group-hover:text-blue-700 transition-colors">
                          {device.current_lifecycle_phase || lang('productDashboard.familyDashboard.notAssigned')}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusLabel === 'Launched' ? 'default' : 'outline'} className="capitalize">
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground group-hover:text-blue-700 transition-colors">
                          {statusLabel === 'Launched' ? lang('productDashboard.familyDashboard.onTrack') : lang('productDashboard.familyDashboard.needsAttention')}
                        </td>
                        <td className="py-3 text-muted-foreground group-hover:text-blue-700 transition-colors">
                          {updatedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface VariantOptionBadgesProps {
  deviceId: string;
  variantDimensions: { id: string; name: string; is_active: boolean }[];
  productVariantOptions: Record<string, ProductVariantOptionEntry[]>;
}

function VariantOptionBadges({ deviceId, variantDimensions, productVariantOptions }: VariantOptionBadgesProps) {
  const { lang } = useTranslation();
  const options = productVariantOptions?.[deviceId] || [];

  if (!options.length) {
    return <span className="text-muted-foreground">{lang('productDashboard.familyDashboard.noOptionsTracked')}</span>;
  }

  const optionMap = new Map(options.map((entry) => [entry.dimensionId, entry]));

  const orderedEntries =
    (variantDimensions || []).length > 0
      ? variantDimensions
          .filter((dimension) => optionMap.has(dimension.id))
          .map((dimension) => {
            const entry = optionMap.get(dimension.id)!;
            return {
              ...entry,
              dimensionName: entry.dimensionName || dimension.name,
            };
          })
      : options;

  if (!orderedEntries.length) {
    return <span className="text-muted-foreground">{lang('productDashboard.familyDashboard.noOptionsTracked')}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {orderedEntries.map((entry) => (
        <Badge
          key={`${deviceId}-${entry.dimensionId}`}
          variant="outline"
          className="bg-white text-xs font-medium text-foreground"
        >
          <span className="text-muted-foreground">{entry.dimensionName || 'Option'}:</span>
          <span className="ml-1 text-foreground">{entry.optionName || entry.valueText || '—'}</span>
        </Badge>
      ))}
    </div>
  );
}
