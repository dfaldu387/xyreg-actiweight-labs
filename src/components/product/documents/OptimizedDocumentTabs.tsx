import React, { useState, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CurrentPhaseDocumentsTab } from "./CurrentPhaseDocumentsTab";
import { AllActivePhasesTab } from "./AllActivePhasesTab";
import { ProductSpecificDocumentsTab } from "./ProductSpecificDocumentsTab";
import { useIsolatedDocumentOperations } from "@/hooks/useIsolatedDocumentOperations";

interface OptimizedDocumentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentPhaseInstances: any[];
  allPhaseInstances: any[];
  productSpecificDocuments: any[];
  phases: any[];
  currentLifecyclePhase?: string | null;
  productId?: string;
  companyId?: string;
  onDocumentUpdated: (document: any) => void;
  onDocumentsRefresh: () => Promise<any>;
  onAddDocumentClick: () => void;
  statusFilter?: string[];
}

/**
 * Optimized DocumentTabs component with proper memoization and performance optimizations
 */
export const OptimizedDocumentTabs = React.memo<OptimizedDocumentTabsProps>(({
  onTabChange,
  currentPhaseInstances,
  allPhaseInstances,
  productSpecificDocuments,
  phases,
  currentLifecyclePhase,
  productId,
  companyId,
  onDocumentUpdated,
  onDocumentsRefresh,
  onAddDocumentClick,
  statusFilter = []
}) => {
  const [activeTab, setActiveTab] = useState("product-specific");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use isolated document operations with memoized dependencies
  const {
    isUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId || '', companyId || '');
  
  // Memoized validation check
  const isValidConfiguration = useMemo(() => {
    return Boolean(productId && companyId);
  }, [productId, companyId]);

  // Enhanced filter function to handle "Overdue" as computed status
  const filteredByStatus = useCallback((documents: any[]) => {
    console.log('[OptimizedDocumentTabs] filteredByStatus called with:', {
      documentsCount: documents.length,
      statusFilter,
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        due_date: doc.due_date,
        deadline: doc.deadline
      }))
    });
    
    if (!statusFilter || statusFilter.length === 0) {
      console.log('[OptimizedDocumentTabs] No status filter, returning all documents');
      return documents;
    }
    
    const now = new Date();
    console.log('[OptimizedDocumentTabs] Current date for comparison:', now.toISOString());
    
    const filteredDocs = documents.filter(doc => {
      const docStatus = doc.status || 'Not Started';
      const dueDate = doc.due_date; // Only use due_date, not deadline
      
      console.log('[OptimizedDocumentTabs] Processing document:', {
        id: doc.id,
        name: doc.name,
        docStatus,
        dueDate,
        dueDateType: typeof dueDate
      });
      
      // Calculate if document is overdue
      let isOverdue = false;
      if (dueDate) {
        const dueDateObj = new Date(dueDate);
        isOverdue = dueDateObj < now;
        console.log('[OptimizedDocumentTabs] Overdue calculation:', {
          dueDate,
          dueDateObj: dueDateObj.toISOString(),
          now: now.toISOString(),
          isOverdue,
          comparison: `${dueDateObj.getTime()} < ${now.getTime()}`
        });
      }
      
      // Check if any of the selected filters match this document
      const matchesFilter = statusFilter.some(filterStatus => {
        console.log('[OptimizedDocumentTabs] Checking filter:', filterStatus);
        
        if (filterStatus === 'Overdue') {
          // For overdue filter, check if document is actually overdue
          const matches = isOverdue;
          console.log('[OptimizedDocumentTabs] Overdue filter result:', {
            documentName: doc.name,
            isOverdue,
            matches
          });
          return matches;
        } else {
          // For regular status filters, check exact match
          const matches = docStatus === filterStatus;
          console.log('[OptimizedDocumentTabs] Status filter result:', {
            documentName: doc.name,
            docStatus,
            filterStatus,
            matches
          });
          return matches;
        }
      });
      
      console.log('[OptimizedDocumentTabs] Final filter result for document:', {
        documentName: doc.name,
        matchesFilter
      });
      
      return matchesFilter;
    });
    
    console.log('[OptimizedDocumentTabs] Filtered documents result:', {
      originalCount: documents.length,
      filteredCount: filteredDocs.length,
      filteredDocuments: filteredDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        due_date: doc.due_date
      }))
    });
    
    return filteredDocs;
  }, [statusFilter]);

  // Memoized enhanced phases calculation
  const enhancedPhases = useMemo(() => {
    if (!Array.isArray(phases)) return [];
    
    return phases.map(phase => {
      const phaseDocuments = Array.isArray(allPhaseInstances) 
        ? allPhaseInstances.filter(doc => 
            doc.phase_id === phase.id && 
            doc.document_scope === 'product_document' && 
            doc.template_source_id
          ) 
        : [];
      
      const filteredPhaseDocuments = filteredByStatus(phaseDocuments);
      
      return {
        ...phase,
        documents: filteredPhaseDocuments,
        allDocuments: phaseDocuments,
        isCurrentPhase: phase.name === currentLifecyclePhase
      };
    });
  }, [phases, allPhaseInstances, filteredByStatus, currentLifecyclePhase]);

  // Memoized filtered document arrays

  const filteredProductSpecificDocuments = useMemo(() => {
    return filteredByStatus(productSpecificDocuments);
  }, [productSpecificDocuments, filteredByStatus]);

  // Memoized count calculations using filtered data
  const counts = useMemo(() => {
    const templateBasedInstancesCount = currentPhaseInstances.filter(doc => 
      doc.template_source_id && doc.document_scope === 'product_document'
    ).length;

    const productSpecificCount = filteredProductSpecificDocuments.filter(doc => 
      !doc.template_source_id && doc.document_scope === 'product_document'
    ).length;

    return {
      templateBasedInstancesCount,
      productSpecificCount,
      phasesCount: enhancedPhases.length
    };
  }, [currentPhaseInstances, filteredProductSpecificDocuments, enhancedPhases]);

  // Optimized tab change handler
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    onTabChange(newTab);
  }, [onTabChange]);

  // Optimized sync handler
  const handleSyncInstances = useCallback(async () => {
    setIsSyncing(true);
    try {
      await onDocumentsRefresh();
    } finally {
      setIsSyncing(false);
    }
  }, [onDocumentsRefresh]);

  // Optimized document status update handler
  const handleDocumentStatusUpdate = useCallback(async (documentId: string, status: string) => {
    console.log("Updating document status:", documentId, status);
    
    const success = await updateDocumentStatus(documentId, status);
    if (success) {
      await onDocumentsRefresh();
    }
  }, [updateDocumentStatus, onDocumentsRefresh]);

  // Optimized deadline update handler
  const handleDocumentDeadlineUpdate = useCallback(async (documentId: string, deadline: Date | undefined) => {
    console.log("Updating document deadline:", documentId, deadline);
    
    const success = await updateDocumentDeadline(documentId, deadline);
    if (success) {
      await onDocumentsRefresh();
    }
  }, [updateDocumentDeadline, onDocumentsRefresh]);

  // Optimized phase navigation handler
  const handlePhaseNavigation = useCallback((phaseName: string) => {
    setActiveTab("current-phase");
    onTabChange("current-phase");
  }, [onTabChange]);

  // Early return for invalid configuration
  if (!isValidConfiguration) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Product or company information not available
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="current-phase" className="flex items-center gap-2">
          Current Phase Documents
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {counts.templateBasedInstancesCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="all-phases" className="flex items-center gap-2">
          All Active Phases
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {counts.phasesCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="product-specific" className="flex items-center gap-2">
          Product-Specific Documents
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            {counts.productSpecificCount}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="current-phase">
        <CurrentPhaseDocumentsTab
          currentPhase={currentLifecyclePhase}
          phaseDocuments={currentPhaseInstances}
          onSyncCompanyDocs={handleSyncInstances}
          onDocumentStatusChange={handleDocumentStatusUpdate}
          onDocumentDeadlineChange={handleDocumentDeadlineUpdate}
          onDocumentUpdated={onDocumentUpdated}
          isSyncing={isSyncing}
          isUpdating={isUpdating}
          productId={productId!}
          companyId={companyId!}
          handleRefreshData={onDocumentsRefresh}
        />
      </TabsContent>

      <TabsContent value="all-phases">
        <AllActivePhasesTab
          phases={enhancedPhases}
          currentPhase={currentLifecyclePhase}
          onPhaseClick={handlePhaseNavigation}
          statusFilter={statusFilter}
          companyId={companyId!}
          productId={productId!}
          onDocumentUpdated={onDocumentUpdated}
        />
      </TabsContent>

      <TabsContent value="product-specific">
        <ProductSpecificDocumentsTab
          productDocuments={filteredProductSpecificDocuments}
          onAddDocumentClick={onAddDocumentClick}
          onDocumentStatusChange={handleDocumentStatusUpdate}
          onDocumentDeadlineChange={handleDocumentDeadlineUpdate}
          onDocumentUpdated={onDocumentUpdated}
          isUpdating={isUpdating}
          productId={productId!}
          companyId={companyId!}
          handleRefreshData={onDocumentsRefresh}
        />
      </TabsContent>
    </Tabs>
  );
});

OptimizedDocumentTabs.displayName = 'OptimizedDocumentTabs';
