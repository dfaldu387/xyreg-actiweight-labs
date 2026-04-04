
import { useState } from 'react';
import { toast } from 'sonner';
import { ConsolidatedAutomaticInstanceService } from '@/services/consolidatedAutomaticInstanceService';

interface UseProductDocumentOperationsProps {
  productId: string;
  companyId: string;
  onRefresh: () => Promise<any>;
}

interface DocumentOperationResult {
  success: boolean;
  instances: number;
  error?: string;
}

export function useProductDocumentOperations({
  productId,
  companyId,
  onRefresh
}: UseProductDocumentOperationsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Create consolidated automatic instance service
  const instanceService = productId && companyId ? 
    new ConsolidatedAutomaticInstanceService(productId, companyId) : null;

  // Enhanced sync function using new instantiation service
  const handleSyncAllCompanyTemplates = async (): Promise<DocumentOperationResult> => {
    if (!productId || !companyId) {
      const errorMsg = "Cannot sync: missing product or company information";
      toast.error(errorMsg);
      return { success: false, instances: 0, error: errorMsg };
    }
    
    setIsSyncing(true);
    try {
      console.log("Instantiating ALL company template documents for product...");
      
      // Use the new ProductDocumentInstantiationService
      const { ProductDocumentInstantiationService } = await import('@/services/productDocumentInstantiationService');
      const instantiationService = new ProductDocumentInstantiationService(productId, companyId);
      
      const result = await instantiationService.instantiateAllTemplates();
      
      if (result.success || result.created > 0) {
        await onRefresh();
        
        if (result.created > 0) {
          toast.success(`Created ${result.created} document instances from templates`);
        } else if (result.existing > 0) {
          toast.info(`All ${result.existing} document instances already exist`);
        }
      }
      
      if (result.errors.length > 0) {
        console.warn("Instantiation completed with errors:", result.errors);
        toast.warning(`Completed with ${result.errors.length} warnings`);
      }
      
      return { 
        success: result.success, 
        instances: result.created + result.existing 
      };
    } catch (error) {
      console.error("Error instantiating company templates:", error);
      const errorMsg = "Failed to instantiate company templates";
      toast.error(errorMsg);
      return { success: false, instances: 0, error: errorMsg };
    } finally {
      setIsSyncing(false);
    }
  };

  // Enhanced refresh that ensures instances exist
  const handleDocumentsRefresh = async (): Promise<DocumentOperationResult> => {
    console.log("Refreshing product documents and ensuring instances exist");
    
    try {
      // Ensure instances exist for current phase
      if (instanceService) {
        await instanceService.ensureInstancesForCurrentPhase();
      }
      
      // Refresh document data
      const result = await onRefresh();
      
      const instanceCount = result?.instances || 0;
      return { success: true, instances: instanceCount };
    } catch (error) {
      console.error("Error in document refresh process:", error);
      const errorMsg = "Failed to refresh documents";
      toast.error(errorMsg);
      return { success: false, instances: 0, error: errorMsg };
    }
  };

  return {
    isSyncing,
    handleSyncAllCompanyTemplates,
    handleDocumentsRefresh
  };
}
