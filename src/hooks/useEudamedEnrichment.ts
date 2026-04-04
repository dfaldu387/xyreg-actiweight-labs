import { useState, useCallback } from 'react';
import { EudamedEnrichmentService, EudamedEnrichmentResult, ProductMatch, EudamedCompleteReinstallResult } from '@/services/eudamedEnrichmentService';
import { toast } from 'sonner';

export function useEudamedEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 100, operation: '' });

  const enrichExistingProducts = useCallback(async (companyId: string): Promise<EudamedEnrichmentResult> => {
    setIsEnriching(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting enrichment...' });
    
    try {
      const result = await EudamedEnrichmentService.enrichExistingProducts(
        companyId,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
      if (result.success) {
        if (result.enrichedProducts > 0) {
          toast.success(`Successfully enriched ${result.enrichedProducts} products with EUDAMED data`);
        } else {
          toast.info('All products already have EUDAMED data or no matches found');
        }
      } else {
        toast.error(`Enrichment completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Enrichment failed:', error);
      toast.error(`Enrichment failed: ${error}`);
      throw error;
    } finally {
      setIsEnriching(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  const getProductMatches = useCallback(async (companyId: string): Promise<ProductMatch[]> => {
    return await EudamedEnrichmentService.getProductMatches(companyId);
  }, []);

  const enrichSingleProduct = useCallback(async (productId: string, eudamedDevice: any) => {
    return await EudamedEnrichmentService.enrichSingleProduct(productId, eudamedDevice);
  }, []);

  const completeReinstallFromEudamed = useCallback(async (companyId: string): Promise<EudamedCompleteReinstallResult> => {
    setIsEnriching(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting complete reinstallation...' });
    
    try {
      const result = await EudamedEnrichmentService.completeReinstallFromEudamed(
        companyId,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
      if (result.success) {
        if (result.processedProducts > 0) {
          toast.success(`Successfully reinstalled EUDAMED data for ${result.processedProducts} products`);
          
          // Force page refresh to show updated data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.info('No products were processed during reinstallation');
        }
      } else {
        toast.error(`Reinstallation completed with ${result.errors.length} errors`);
        // Show detailed error information
        if (result.errors.length > 0) {
          console.error('Reinstallation errors:', result.errors);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Complete reinstallation failed:', error);
      toast.error(`Complete reinstallation failed: ${error}`);
      throw error;
    } finally {
      setIsEnriching(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  return {
    isEnriching,
    progress,
    enrichExistingProducts,
    getProductMatches,
    enrichSingleProduct,
    completeReinstallFromEudamed
  };
}