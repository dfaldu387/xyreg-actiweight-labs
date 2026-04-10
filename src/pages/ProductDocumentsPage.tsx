import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { useOptimizedProductDocuments } from "@/hooks/useOptimizedProductDocuments";
import { useCompanyDocumentTemplates } from "@/hooks/useCompanyDocumentTemplates";
import { useProductDocumentOperations } from "@/hooks/useProductDocumentOperations";
import { DocumentStatusSummary } from "@/components/product/documents/DocumentStatusSummary";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { DocumentTabs } from "@/components/product/documents/DocumentTabs";
import { ProductDocumentCreationContainer } from "@/components/product/documents/ProductDocumentCreationContainer";
import { DocumentStatusOperations } from "@/components/product/documents/DocumentStatusOperations";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Zap, Link, Upload } from "lucide-react";
import { TemplatesSettings } from "@/components/settings/TemplatesSettings";
import { ReferenceDocumentsTab } from "@/components/document-composer/ReferenceDocumentsTab";
import { DocumentDependencyDialog } from "@/components/product/documents/DocumentDependencyDialog";
import { ProductDocumentSyncPage } from "@/components/documents/ProductDocumentSyncPage";
// import { DocumentDebugPanel } from "@/components/product/documents/DocumentDebugPanel";
import { DocumentErrorBoundary } from "@/components/common/DocumentErrorBoundary";
import { BulkDocumentUploadDialog } from "@/components/product/documents/BulkDocumentUploadDialog";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { mapDBStatusToUI } from "@/utils/statusUtils";

export default function ProductDocumentsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const activeMainTab = searchParams.get('tab') || 'documents';
  const phaseFilter = searchParams.get('phase');
  const filterFromUrl = searchParams.get('filter');
  const statusFromUrl = searchParams.get('status');
  const mode = searchParams.get('mode');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newlyCreatedDoc, setNewlyCreatedDoc] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [phaseFilterArray, setPhaseFilterArray] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // AI Summary Sidebar state (lifted from AllActivePhasesTab)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDocsForSummary, setSelectedDocsForSummary] = useState<Set<string>>(new Set());

  // Handler for toggling document selection for AI Summary
  const handleToggleDocForSummary = (docId: string) => {
    setSelectedDocsForSummary(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // Clear selected docs when sidebar closes
  React.useEffect(() => {
    if (!isSidebarOpen) {
      setSelectedDocsForSummary(new Set());
    }
  }, [isSidebarOpen]);

  // Check if Documents feature is enabled
  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.COMPLIANCE_DOCUMENTS);
  const isRestricted = !isFeatureEnabled;

  // Initialize filters from URL parameters
  useEffect(() => {
    // filter parameter (from Gantt chart) = document name search
    // phase parameter = phase filter (legacy)

    // Set document name search from ?filter= parameter
    if (filterFromUrl) {
      setSearchQuery(filterFromUrl);
    }

    // Set phase filter from ?phase= parameter
    if (phaseFilter) {
      setPhaseFilterArray([phaseFilter]);
    }

    // Only set status filter if both phase and status are in URL
    // If only phase is provided, clear status filter
    if (statusFromUrl && phaseFilter) {
      setStatusFilter([statusFromUrl]);
    } else if (phaseFilter && !statusFromUrl) {
      setStatusFilter([]); // Clear status filter when only phase is set
    }
  }, [phaseFilter, filterFromUrl, statusFromUrl]);


  // Track whether initial data has loaded (to avoid full-page loader on refetches)
  const hasInitiallyLoaded = useRef(false);

  // Force refetch product details when page loads to get latest phase
  const { data: product, isLoading: productLoading, refetch: refetchProduct } = useProductDetails(productId, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0 // Ensure we always fetch fresh data
  });

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, productLoading);

  const { companyId } = useCompanyProducts(product?.company_id || "");

  // Get company template documents for reference
  const {
    phases: companyPhases,
    isLoading: templatesLoading,
    refreshTemplates
  } = useCompanyDocumentTemplates(companyId);

  // Use optimized hook with template inheritance
  const {
    documents,
    phases,
    isLoading,
    error: documentsError,
    updateDocumentStatus,
    updateDocumentInState,
    removeDocumentFromState,
    addDocumentToState,
    refreshDocuments,
    productSpecificDocument,
    lastUpdateTimestamp
  } = useOptimizedProductDocuments(productId || '', companyId || '');
  
  // Calculate market status for badges (must be at top level with other hooks)
  const marketStatus = useProductMarketStatus(product?.markets);
  
  // console.log('documents 2312312', documents);
  // console.log('phases 2312312', phases);
  // Derived data from optimized documents
  const currentLifecyclePhase = product?.current_lifecycle_phase;

  // Filter documents by current phase (templates from lifecycle phases)
  const currentPhaseInstances = useMemo(() => {
    if (!documents || !currentLifecyclePhase) return [];
    
    // Filter documents to only show ones from the current lifecycle phase
    return documents.filter(doc => {
      // Find the phase for this document
      const documentPhase = phases.find(phase => phase.id === doc.phaseId || phase.phase_id === doc.phaseId);
      return documentPhase && documentPhase.name === currentLifecyclePhase;
    });
  }, [documents, currentLifecyclePhase, phases]);
  // console.log('currentPhaseInstances 2312312', currentPhaseInstances);
  
  // Get company phase names for filtering
  const companyPhaseNames = useMemo(() => {
    return (companyPhases || []).map(p => p.name);
  }, [companyPhases]);

  // All documents filtered to only show ones from active company phases  
  const allPhaseInstances = useMemo(() => {
    if (!documents) return [];
    // If no phases available (e.g. variant with no lifecycle phases), return all documents
    if (!phases || phases.length === 0 || companyPhaseNames.length === 0) return documents;
    
    // Filter documents to only include those from phases in company_chosen_phases
    console.log('[DocFilter] documents:', documents.length, 'phases:', phases.length, 'companyPhaseNames:', companyPhaseNames);
    const result = documents.filter(doc => {
      // Always include inherited docs from master - they should never be filtered out
      if ((doc as any).isInheritedFromMaster) return true;
      // If document has no phase, include it (core/unphased documents)
      if (!doc.phaseId) return true;
      const documentPhase = phases.find(phase => phase.id === doc.phaseId || phase.phase_id === doc.phaseId);
      // If phase not found in lifecycle phases, try matching directly against company phase names
      if (!documentPhase) {
        // Check if the document's phaseName (resolved in the hook) matches a chosen phase
        const match = companyPhaseNames.includes(doc.phaseName);
        if (!match) console.log('[DocFilter] No phase match for doc:', doc.name, 'phaseId:', doc.phaseId, 'phaseName:', doc.phaseName);
        return match;
      }
      const match = companyPhaseNames.includes(documentPhase.name);
      if (!match) console.log('[DocFilter] Phase name not in companyPhaseNames:', documentPhase.name, 'doc:', doc.name);
      return match;
    });
    console.log('[DocFilter] Result:', result.length, 'of', documents.length);
    return result;
  }, [documents, phases, companyPhaseNames]);

  // Product-specific documents (non-template documents)
  const productSpecificDocuments = useMemo(() => {
    // console.log('[ProductDocumentsPage] productSpecificDocument received:', productSpecificDocument);
    // console.log('[ProductDocumentsPage] productSpecificDocument length:', productSpecificDocument?.length || 0);
    if (!productSpecificDocument) {
      // console.log('[ProductDocumentsPage] No productSpecificDocument, returning empty array');
      return [];
    }
    const filtered = productSpecificDocument.filter(doc => !doc.isTemplate);
    // console.log('[ProductDocumentsPage] productSpecificDocuments after filter (removed isTemplate=true):', filtered);
    // console.log('[ProductDocumentsPage] Filtered length:', filtered.length);
    return filtered;
  }, [productSpecificDocument]);

  // Calculate filtered documents for KPI display based on active filters
  const filteredDocumentsForKPI = useMemo(() => {
    // console.log('Recalculating filteredDocumentsForKPI:', {
    //   documentsCount: allPhaseInstances?.length || 0,
    //   statusFilterLength: statusFilter.length,
    //   phaseFilterLength: phaseFilterArray.length,
    //   lastUpdate: lastUpdateTimestamp
    // });
    
    // Start with documents already filtered by company phases
    let filtered = allPhaseInstances || [];

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const uiStatus = mapDBStatusToUI(doc.status);
        return statusFilter.includes(uiStatus);
      });
    }

    // Apply phase filter (from DocumentTabs component)
    if (phaseFilterArray.length > 0) {
      filtered = filtered.filter(doc => {
        // Find the phase for this document
        const documentPhase = phases.find(phase => phase.id === doc.phaseId);
        return documentPhase && phaseFilterArray.includes(documentPhase.name);
      });
    }

    // console.log('Filtered documents for KPI:', {
    //   filteredCount: filtered.length,
    //   statusBreakdown: filtered.reduce((acc, doc) => {
    //     acc[doc.status] = (acc[doc.status] || 0) + 1;
    //     return acc;
    //   }, {} as Record<string, number>)
    // });

    return filtered;
  }, [allPhaseInstances, statusFilter, phaseFilterArray, phases, lastUpdateTimestamp]);


  const handleDocumentUpdate = (documentId: string, updatedDoc: any) => {
    // console.log("handleDocumentUpdate", documentId, updatedDoc);
    updateDocumentStatus(documentId, updatedDoc.status, updatedDoc.reviewer_group_id);
  };

  const fetchPhasesAndDocuments = async () => {
    await refreshDocuments();
  };

  // Custom hook for document operations with proper error handling
  const {
    isSyncing,
    handleSyncAllCompanyTemplates,
    handleDocumentsRefresh
  } = useProductDocumentOperations({
    productId: productId || '',
    companyId: companyId || '',
    onRefresh: async () => {
      await refreshDocuments();
      if (refreshTemplates) await refreshTemplates();
      return {
        success: true,
        instances: documents?.length || 0
      };
    }
  });

  // Enhanced page initialization with cache invalidation
  useEffect(() => {
    const initializePage = async () => {
      // console.log('[ProductDocumentsPage] Initializing page, invalidating caches...');

      // Check if we came from device info page (URL param)
      const fromDeviceInfo = searchParams.get('from') === 'device-info';

      if (fromDeviceInfo || productId) {
        // Invalidate all relevant caches to ensure fresh data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['productDetails', productId] }),
          queryClient.invalidateQueries({ queryKey: ['companyProductPhases'] }),
          queryClient.invalidateQueries({ queryKey: ['phases', productId] }),
          queryClient.invalidateQueries({ queryKey: ['documents', productId] })
        ]);

        // Force refetch product details
        if (refetchProduct) {
          await refetchProduct();
        }

        // console.log('[ProductDocumentsPage] Cache invalidation complete');

        if (fromDeviceInfo) {
          toast.success('Product data refreshed');
        }
      }
    };

    initializePage();
  }, [productId, searchParams, refetchProduct]);

  // Monitor product phase changes and log for debugging
  useEffect(() => {
    if (product?.current_lifecycle_phase) {
      // console.log('[ProductDocumentsPage] Current product phase:', product.current_lifecycle_phase);
      // console.log('[ProductDocumentsPage] Current lifecycle phase from hook:', currentLifecyclePhase);

      if (currentLifecyclePhase && currentLifecyclePhase !== product.current_lifecycle_phase) {
        console.warn('[ProductDocumentsPage] Phase mismatch detected, refreshing documents...');
        refreshDocuments();
      }
    }
  }, [product?.current_lifecycle_phase, currentLifecyclePhase, refreshDocuments]);

  // Deep-link: auto-open document drawer when ?docId= is present
  useEffect(() => {
    const docId = searchParams.get('docId');
    if (!docId || !documents || documents.length === 0) return;
    const doc = documents.find((d: any) => d.id === docId);
    if (doc) {
      // Map to DocumentCICard shape expected by AllActivePhasesTab/DrawerDocument
      setNewlyCreatedDoc({
        id: doc.id,
        name: doc.name,
        document_type: doc.documentType || 'Standard',
        status: doc.status,
        file_path: doc.file_path || doc.filePath,
        file_name: doc.file_name || doc.fileName,
        _deepLink: true,
      });
      // Clear the docId param to avoid re-opening on subsequent renders
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('docId');
        return next;
      }, { replace: true });
    }
  }, [searchParams, documents, setSearchParams]);

  // Enhanced refresh wrapper with consistent return type
  // IMPORTANT: Uses safe refresh path — does NOT call ensureInstancesForCurrentPhase/cleanupProductData
  // which would destroy lifecycle_phases records (see bug fix 2026-02-17)
  const enhancedRefresh = async () => {
    // Bump trigger so child components (AllActivePhasesTab) refetch their data
    setRefreshTrigger(prev => prev + 1);

    // Run all refreshes in parallel for faster UI update
    await Promise.all([
      refreshDocuments(),
      refetchProduct?.(),
      queryClient.invalidateQueries({ queryKey: ['phase-documents'] }),
      queryClient.invalidateQueries({ queryKey: ['optimized-documents'] }),
    ]);

    return { success: true, instances: 0 };
  };

  // Safe refresh for after Sync Documents — only refetches data, no cleanup/instance creation
  const safeDocumentsRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] }),
      queryClient.invalidateQueries({ queryKey: ['phases', productId] }),
      queryClient.invalidateQueries({ queryKey: ['documents', productId] })
    ]);
    await refreshDocuments();
    if (refetchProduct) {
      await refetchProduct();
    }
    // Trigger AllActivePhasesTab to refetch usePhaseDocuments
    setRefreshTrigger(prev => prev + 1);
  };

  // Enhanced sync wrapper with consistent return type
  const enhancedSync = async () => {
    // console.log('[ProductDocumentsPage] Enhanced sync triggered');
    const result = await handleSyncAllCompanyTemplates();

    // Refresh product data after sync
    if (refetchProduct) {
      await refetchProduct();
    }

    return result;
  };

  // Archive and edit handlers for the header
  const handleArchiveProduct = async () => {
    // Implementation would go here - for now just show a toast
    toast.info("Archive functionality would be implemented here");
  };

  const handleRefreshData = async () => {
    toast.info("Refreshing device data...");
    await enhancedRefresh();
  };


  const onDocumentUpdated = (document: any) => {
    // Instant local state update for immediate UI feedback
    updateDocumentInState(document);
    handleDocumentUpdate(document.id, document);
  };

  const handleStatusFilterChange = (status: string) => {
    if (status === '__SHOW_ALL__' || status === '__CLEAR_ALL__') {
      setStatusFilter([]);
    } else {
      setStatusFilter(prev =>
        prev.includes(status)
          ? prev.filter(s => s !== status)
          : [...prev, status]
      );
    }
  };

  const handlePhaseFilterChange = (phaseFilter: string[]) => {
    setPhaseFilterArray(phaseFilter);
  };

  // Handle search query change and sync with URL filter param
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    const newParams = new URLSearchParams(location.search);
    if (query) {
      newParams.set('filter', query);
    } else {
      newParams.delete('filter');
    }
    const newSearch = newParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };


  // Loading state — only show full-page loader on initial load, not on refetches
  const isInitialLoading = productLoading || isLoading || templatesLoading || isLoadingPlanAccess;
  if (isInitialLoading && !hasInitiallyLoaded.current) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading device documents...</p>
        </div>
      </div>
    );
  }

  // Mark initial load as complete once data is ready
  if (!isInitialLoading && !hasInitiallyLoaded.current) {
    hasInitiallyLoaded.current = true;
  }

  if (!product) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
        </div>
      </div>
    );
  }

  // If mode=dev, show the sync page
  if (mode === 'dev') {
    return (
      <DocumentErrorBoundary>
        <RestrictedFeatureProvider
          isRestricted={isRestricted}
          planName={planName}
          featureName="Documents"
        >
          <div className="flex h-full min-h-0 flex-col">
            <ProductPageHeader
              product={product}
              subsection="Document Sync Info"
              onRefresh={handleRefreshData}
              isRefreshing={false}
              marketStatus={marketStatus}
            />

            {isRestricted && <RestrictedPreviewBanner className="mt-2 !mb-0" />}

            <div className="flex-1 overflow-y-auto">
              <ProductDocumentSyncPage
                productId={productId || ''}
                productName={product.name || 'Product'}
                companyId={companyId || ''}
              />
            </div>
          </div>
        </RestrictedFeatureProvider>
      </DocumentErrorBoundary>
    );
  }

  const totalDocuments = documents?.length || 0;

  return (
    <DocumentErrorBoundary>
      <div className={`flex h-full min-h-0 flex-col transition-all duration-300 ${isSidebarOpen ? 'pr-[478px]' : ''}`} data-tour="documents">
        <ProductPageHeader
          product={product}
          subsection="Documents"
          onRefresh={handleRefreshData}
          isRefreshing={false}
          marketStatus={marketStatus}
        />

        <RestrictedFeatureProvider
          isRestricted={isRestricted}
          planName={planName}
          featureName="Documents"
        >
          {isRestricted && <RestrictedPreviewBanner className="mt-2 !mb-0" />}
          <div className="flex-1 overflow-y-auto">
            <Tabs
              value={activeMainTab}
              onValueChange={(value) => {
                const newParams = new URLSearchParams(searchParams);
                if (value === 'documents') {
                  newParams.delete('tab');
                } else {
                  newParams.set('tab', value);
                }
                const newSearch = newParams.toString();
                navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
              }}
              className="w-full"
            >
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="reference-documents">Reference Documents</TabsTrigger>
                <TabsTrigger value="device-templates">Device Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="documents">
                <div className="w-full py-2 sm:py-3 lg:py-4 space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    </div>
                  </div>

                  <DocumentStatusSummary
                    companyId={companyId || ''}
                    productId={productId || ''}
                  />

                  <DocumentStatusOperations
                    productId={productId || ''}
                    companyId={companyId || ''}
                    phases={companyPhases && companyPhases.length > 0 ? companyPhases : phases}
                    onRefresh={enhancedRefresh}
                  >
                    {(operations) => (
                      <DocumentTabs
                        activeTab="all-phases"
                        onTabChange={() => { }}
                        currentPhaseInstances={currentPhaseInstances}
                        allPhaseInstances={allPhaseInstances}
                        productSpecificDocuments={productSpecificDocuments}
                        phases={companyPhases && companyPhases.length > 0 ? companyPhases : phases}
                        currentLifecyclePhase={currentLifecyclePhase}
                        refreshTrigger={refreshTrigger}
                        newlyCreatedDoc={newlyCreatedDoc}
                        productId={productId}
                        companyId={companyId}
                        onDocumentUpdated={onDocumentUpdated}
                        onDocumentsRefresh={enhancedRefresh}
                        onSyncRefresh={safeDocumentsRefresh}
                        onAddDocumentClick={() => setShowAddDialog(true)}
                        onBulkUploadClick={() => setShowBulkUpload(true)}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusFilterChange}
                        onPhaseDeadlineChange={operations.handlePhaseDeadlineChange}
                        onDocumentStatusChange={operations.handleDocumentStatusChange}
                        onDocumentDeadlineChange={operations.handleDocumentDeadlineChange}
                        phaseFilter={filterFromUrl || phaseFilter}
                        onPhaseFilterChange={handlePhaseFilterChange}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        disabled={isRestricted}
                        authorFilter={operations.authorFilter}
                        onAuthorFilterChange={operations.onAuthorFilterChange}
                        dateFilter={operations.dateFilter}
                        onDateFilterChange={operations.onDateFilterChange}
                        clearAllFilters={operations.clearAllFilters}
                        availableAuthors={operations.availableAuthors}
                        availablePhases={operations.availablePhases}
                        availableStatuses={operations.availableStatuses}
                        isSidebarOpen={isSidebarOpen}
                        onSidebarOpenChange={setIsSidebarOpen}
                        selectedDocsForSummary={selectedDocsForSummary}
                        onToggleDocForSummary={handleToggleDocForSummary}
                      />
                    )}
                  </DocumentStatusOperations>
                </div>
              </TabsContent>

              <TabsContent value="reference-documents">
                <div className="py-2 sm:py-3 lg:py-4">
                  <ReferenceDocumentsTab companyId={companyId} productId={productId} />
                </div>
              </TabsContent>

              <TabsContent value="device-templates">
                <div className="py-2 sm:py-3 lg:py-4">
                  <TemplatesSettings companyId={companyId || ''} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </RestrictedFeatureProvider>

        {/* Product Document Creation Dialog */}
        <ProductDocumentCreationContainer
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              enhancedRefresh();
            }
          }}
          productId={productId || ''}
          companyId={companyId || ''}
          onDocumentCreated={async (metadata?: any) => {
            // Optimistic: pass new doc data so list updates instantly
            if (metadata?.documentId) {
              setNewlyCreatedDoc({
                id: `template-${metadata.documentId}`,
                name: metadata.name || 'New Document',
                status: metadata.status || 'Not Started',
                document_type: metadata.document_type || 'Standard',
                description: metadata.description,
                phase_id: metadata.phase_id,
                due_date: metadata.due_date,
                date: metadata.date,
                version: metadata.version,
                authors_ids: metadata.authors_ids,
                reviewer_group_ids: metadata.reviewer_group_ids,
                tags: metadata.tags || [],
                is_record: metadata.is_record,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                isTemplate: true,
              });
            }
            // Background refresh for full data consistency
            return enhancedRefresh();
          }}
        />

        {/* Document Dependency Dialog */}
        <DocumentDependencyDialog
          open={showDependencyDialog}
          onOpenChange={setShowDependencyDialog}
          productId={productId || ''}
          documents={documents?.map(doc => ({
            id: doc.id,
            name: doc.name,
            phaseId: doc.phaseId
          })) || []}
          onDependenciesChange={enhancedRefresh}
        />

        {/* Bulk Document Upload Dialog */}
        <BulkDocumentUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          productId={productId || ''}
          companyId={companyId || ''}
          onComplete={enhancedRefresh}
        />
      </div>
    </DocumentErrorBoundary>
  );
}
