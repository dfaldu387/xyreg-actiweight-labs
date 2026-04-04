import { useState, useCallback } from 'react';
import { EudamedEnrichmentService, EudamedNameUpdateResult } from '@/services/eudamedEnrichmentService';
import { toast } from 'sonner';

export function useEudamedNameUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 100, operation: '' });

  const updateProductNames = useCallback(async (companyId: string): Promise<EudamedNameUpdateResult> => {
    setIsUpdating(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting name update...' });
    
    try {
      const result = await EudamedEnrichmentService.updateProductNamesFromEudamed(
        companyId,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
      if (result.success) {
        if (result.updatedProducts > 0) {
          toast.success(`Successfully updated ${result.updatedProducts} product names with correct EUDAMED device names`);
        } else {
          toast.info('All product names are already using correct EUDAMED device names');
        }
      } else {
        toast.error(`Name update completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Name update failed:', error);
      toast.error(`Name update failed: ${error}`);
      throw error;
    } finally {
      setIsUpdating(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  return {
    isUpdating,
    progress,
    updateProductNames
  };
}