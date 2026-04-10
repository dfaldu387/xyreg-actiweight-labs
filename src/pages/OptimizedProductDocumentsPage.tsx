import { BulkDocumentUploadDialog } from "@/components/product/documents/BulkDocumentUploadDialog";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";
import { useOptimizedProductDocuments, OptimizedDocument } from "@/hooks/useOptimizedProductDocuments";
import { useCompanyDocumentTemplates } from "@/hooks/useCompanyDocumentTemplates";
import { useProductDocumentOperations } from "@/hooks/useProductDocumentOperations";
import { useEnhancedErrorHandling } from "@/hooks/useEnhancedErrorHandling";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useVariantDocuments } from "@/hooks/useVariantDocuments";
import { DocumentStatusSummary } from "@/components/product/documents/DocumentStatusSummary";
import { ProductHeader } from "@/components/product/documents/ProductHeader";
import { OptimizedDocumentTabs } from "@/components/product/documents/OptimizedDocumentTabs";
import { ProductDocumentCreationContainer } from "@/components/product/documents/ProductDocumentCreationContainer";
import { DocumentStatusOperations } from "@/components/product/documents/DocumentStatusOperations";
import { DocumentErrorBoundary } from "@/components/common/DocumentErrorBoundary";
import { VariantDocumentSyncBanner } from "@/components/product/variant/VariantDocumentSyncBanner";
import { VariantDocumentProvider } from "@/components/product/variant/VariantDocumentContext";
import { documentLogger } from "@/utils/documentLogger";

/**
 * Optimized ProductDocumentsPage with enhanced performance, error handling, and logging
 */
export default function OptimizedProductDocumentsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // Performance monitoring
  usePerformanceMonitor('ProductDocumentsPage');
  
  // Enhanced error handling
  const { handleError, withRetry } = useEnhancedErrorHandling();
  
  // Data fetching with error handling
  const { data: product, isLoading: productLoading, error: productError } = useProductDetails(productId);
  const { companyId } = useCompanyProducts(product?.company || "");
  
  // Log page access
  React.useEffect(() => {
    if (productId) {
      documentLogger.info(
        'PageAccess',
        'ProductDocumentsPage accessed',
        { productId },
        { productId, companyId }
      );
    }
  }, [productId, companyId]);

  // Handle product loading error
  React.useEffect(() => {
    if (productError) {
      handleError(productError, 'ProductLoading', {
        metadata: { productId }
      });
    }
  }, [productError, handleError, productId]);
  
  // Variant document inheritance
  const {
    isVariant,
    masterDevice: variantMasterDevice,
    links: variantDocLinks,
    syncFromMaster,
    isSyncing: isVariantSyncing,
    getDocumentInheritanceStatus,
  } = useVariantDocuments(productId);

  // Get company template documents with error handling
  const { 
    phases: companyPhases, 
    isLoading: templatesLoading,
    refreshTemplates 
  } = useCompanyDocumentTemplates(companyId);
  
  // Use optimized hooks with enhanced error handling
  const { 
    documents,
    phases,
    isLoading, 
    error: documentsError,
    updateDocumentStatus,
    updateDocumentInState,
    refreshDocuments
  } = useOptimizedProductDocuments(productId || '', companyId || '');

  // Handle documents loading error
  React.useEffect(() => {
    if (documentsError) {
      handleError(documentsError, 'DocumentsLoading', {
        metadata: { productId, companyId }
      });
    }
  }, [documentsError, handleError, productId, companyId]);

  // Enhanced document operations with retry logic
  const {
    isSyncing,
    handleSyncAllCompanyTemplates,
    handleDocumentsRefresh
  } = useProductDocumentOperations({
    productId: productId || '',
    companyId: companyId || '',
    onRefresh: async () => {
      return await withRetry(async () => {
        await refreshDocuments();
        if (refreshTemplates) await refreshTemplates();
        return { 
          success: true,
          instances: documents.length 
        };
      }, 'document-refresh') || { success: false, instances: 0 };
    }
  });

  // Enhanced refresh wrapper with error handling and logging
  // IMPORTANT: Uses safe refresh path — does NOT call ensureInstancesForCurrentPhase/cleanupProductData
  // which would destroy lifecycle_phases records (see bug fix 2026-02-17)
  const enhancedRefresh = React.useCallback(async () => {
    const startTime = performance.now();

    try {
      documentLogger.info('RefreshOperation', 'Starting document refresh (safe path)', { productId, companyId });

      await refreshDocuments();

      const duration = performance.now() - startTime;
      documentLogger.info('RefreshOperation', 'Document refresh completed', {
        duration: Math.round(duration)
      }, { productId, companyId });

      return { success: true, instances: 0 };
    } catch (error) {
      const duration = performance.now() - startTime;
      documentLogger.error('RefreshOperation', 'Document refresh failed', {
        duration: Math.round(duration),
        error
      }, { productId, companyId });

      handleError(error, 'DocumentRefresh', {
        metadata: { productId, companyId }
      });

      return { success: false, instances: 0 };
    }
  }, [refreshDocuments, handleError, productId, companyId]);

  // Safe refresh for after Sync Documents — only refetches data, no cleanup/instance creation
  const safeDocumentsRefresh = React.useCallback(async () => {
    await refreshDocuments();
  }, [refreshDocuments]);

  // Enhanced sync wrapper with error handling and logging
  const enhancedSync = React.useCallback(async () => {
    const startTime = performance.now();
    
    try {
      documentLogger.info('SyncOperation', 'Starting company templates sync', { productId, companyId });
      
      const result = await withRetry(async () => {
        return await handleSyncAllCompanyTemplates();
      }, 'enhanced-sync');
      
      const duration = performance.now() - startTime;
      documentLogger.info('SyncOperation', 'Company templates sync completed', { 
        duration: Math.round(duration),
        result 
      }, { productId, companyId });
      
      return result || { success: false, instances: 0 };
    } catch (error) {
      const duration = performance.now() - startTime;
      documentLogger.error('SyncOperation', 'Company templates sync failed', { 
        duration: Math.round(duration),
        error 
      }, { productId, companyId });
      
      handleError(error, 'DocumentSync', {
        metadata: { productId, companyId }
      });
      
      return { success: false, instances: 0 };
    }
  }, [handleSyncAllCompanyTemplates, withRetry, handleError, productId, companyId]);

  // Optimized document update wrapper
  const onDocumentUpdated = React.useCallback((updatedDocument: any) => {
    documentLogger.info('DocumentUpdate', 'Product document updated', { documentId: updatedDocument.id }, { productId, companyId });
    
    // Convert the updated document to OptimizedDocument format
    const optimizedDocument: OptimizedDocument = {
      id: updatedDocument.id,
      name: updatedDocument.name,
      status: updatedDocument.status,
      phaseId: updatedDocument.phase_id || updatedDocument.phaseId || '',
      phaseName: updatedDocument.phaseName || '',
      documentType: updatedDocument.document_type || updatedDocument.documentType || 'Standard',
      dueDate: updatedDocument.due_date || updatedDocument.dueDate || updatedDocument.deadline,
      due_date: updatedDocument.due_date || updatedDocument.dueDate || updatedDocument.deadline,
      deadline: updatedDocument.deadline || updatedDocument.due_date || updatedDocument.dueDate,
      isTemplate: !!updatedDocument.template_source_id || !!updatedDocument.templateSourceId,
      templateSourceId: updatedDocument.template_source_id || updatedDocument.templateSourceId,
      productId: updatedDocument.product_id || updatedDocument.productId,
      companyId: updatedDocument.company_id || updatedDocument.companyId,
      description: updatedDocument.description,
      reviewerGroupId: updatedDocument.reviewer_group_id || updatedDocument.reviewerGroupId,
      filePath: updatedDocument.file_path || updatedDocument.filePath,
      fileName: updatedDocument.file_name || updatedDocument.fileName,
      fileSize: updatedDocument.file_size || updatedDocument.fileSize,
      fileType: updatedDocument.file_type || updatedDocument.fileType,
      uploadedAt: updatedDocument.uploaded_at || updatedDocument.uploadedAt,
      uploadedBy: updatedDocument.uploaded_by || updatedDocument.uploadedBy,
    };
    
    // Update the document in local state while preserving its position
    updateDocumentInState(optimizedDocument);
  }, [updateDocumentInState, productId, companyId]);

  // Loading state with enhanced error display
  if (productLoading || isLoading || templatesLoading) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-center h-40">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading device documents...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (productError || documentsError) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Documents</h2>
          <p className="text-muted-foreground">
            There was an issue loading the document information. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
        </div>
      </div>
    );
  }

  const totalDocuments = documents.length;

  return (
    <DocumentErrorBoundary>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Header Section */}
        <ProductHeader
          productName={product.name}
          productId={productId}
          statusFilter={[]}
          onStatusFilterChange={() => {}}
          onAddDocumentClick={() => setShowAddDialog(true)}
          onBulkUploadClick={() => setShowBulkUpload(true)}
          onSyncDocuments={enhancedSync}
          documentsCount={totalDocuments}
          isSyncing={isSyncing}
        />
        
        {/* Variant Document Inheritance Banner */}
        {isVariant && variantMasterDevice && (
          <VariantDocumentSyncBanner
            masterDeviceName={variantMasterDevice.name}
            linkedCount={variantDocLinks.length}
            overriddenCount={variantDocLinks.filter(l => l.is_overridden).length}
            onSync={() => syncFromMaster()}
            isSyncing={isVariantSyncing}
          />
        )}

        {/* Document Status Summary */}
        <DocumentStatusSummary 
          companyId={companyId || ''}
          productId={productId || ''}
          phases={companyPhases && companyPhases.length > 0 ? companyPhases : phases}
        />
        
        {/* Document Tabs with Operations — wrapped in variant context */}
        <VariantDocumentProvider value={{
          isVariant,
          masterDeviceName: variantMasterDevice?.name || null,
          links: variantDocLinks,
          getDocumentInheritanceStatus,
        }}>
          <DocumentStatusOperations
            productId={productId || ''}
            companyId={companyId || ''}
            phases={companyPhases && companyPhases.length > 0 ? companyPhases : phases}
            onRefresh={enhancedRefresh}
          >
            {(operations) => (
              <OptimizedDocumentTabs
                activeTab="current-phase"
                onTabChange={() => {}}
                currentPhaseInstances={documents}
                allPhaseInstances={documents}
                productSpecificDocuments={documents}
                phases={companyPhases && companyPhases.length > 0 ? companyPhases : phases}
                currentLifecyclePhase={product?.current_lifecycle_phase || null}
                productId={productId}
                companyId={companyId}
                onDocumentUpdated={onDocumentUpdated}
                onDocumentsRefresh={enhancedRefresh}
                
                onAddDocumentClick={() => setShowAddDialog(true)}
                statusFilter={[]}
              />
            )}
          </DocumentStatusOperations>
        </VariantDocumentProvider>
        
        {/* Product Document Creation */}
        <ProductDocumentCreationContainer 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          productId={productId || ''}
          companyId={companyId || ''}
          onDocumentCreated={enhancedRefresh}
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
