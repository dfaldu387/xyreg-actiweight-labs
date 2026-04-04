import { useState, useCallback } from 'react';
import { EudamedProductImportService, EudamedImportResult } from '@/services/eudamedProductImportService';
import { toast } from 'sonner';

export function useEudamedProductImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 100, operation: '' });

  const importMissingProducts = useCallback(async (companyId: string): Promise<EudamedImportResult> => {
    setIsImporting(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting import...' });
    
    try {
      const result = await EudamedProductImportService.importMissingProducts(
        companyId,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
      if (result.success) {
        if (result.newProductsCreated > 0) {
          toast.success(`Successfully imported ${result.newProductsCreated} new products from EUDAMED`);
        } else {
          toast.info('All EUDAMED devices are already imported');
        }
      } else {
        toast.error(`Import completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error}`);
      throw error;
    } finally {
      setIsImporting(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  const importSelectedDevices = useCallback(async (companyId: string, selectedDevices: any[]): Promise<EudamedImportResult> => {
    setIsImporting(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting selective import...' });
    
    try {
      const result = await EudamedProductImportService.importSelectedDevices(
        companyId,
        selectedDevices,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
      if (result.success) {
        if (result.newProductsCreated > 0) {
          toast.success(`Successfully imported ${result.newProductsCreated} selected products from EUDAMED`);
        } else {
          toast.info('All selected EUDAMED devices are already imported');
        }
      } else {
        toast.error(`Import completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Selective import failed:', error);
      toast.error(`Selective import failed: ${error}`);
      throw error;
    } finally {
      setIsImporting(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  const getImportStatus = useCallback(async (companyId: string) => {
    return await EudamedProductImportService.getImportStatus(companyId);
  }, []);

  return {
    isImporting,
    progress,
    importMissingProducts,
    importSelectedDevices,
    getImportStatus
  };
}