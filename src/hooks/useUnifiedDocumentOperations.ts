
import { useState } from 'react';
import { toast } from "sonner";
import { updateDocumentStatus, updateDocumentDeadline, toggleDocumentExclusion } from '@/api/unifiedDocumentsApi';
import { ProductDocumentService } from '@/services/productDocumentService';

interface DocumentOperationResult {
  success: boolean;
  error?: string;
}

export const useUnifiedDocumentOperations = (productId: string, companyId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const updateDocStatus = async (documentId: string, status: string): Promise<boolean> => {
    setIsUpdating(true);
    setLastError(null);
    
    try {
      let result: boolean;
      
      // For product documents, use the product service
      if (productId) {
        const service = new ProductDocumentService(productId, companyId);
        result = await service.updateDocumentStatus(documentId, status);
      } else {
        // For company template documents, use unified API
        result = await updateDocumentStatus(documentId, status);
      }
      
      if (result) {
        toast.success("Document status updated successfully");
      } else {
        const errorMsg = "Failed to update document status";
        setLastError(errorMsg);
        toast.error(errorMsg);
      }
      
      return result;
    } catch (error) {
      const errorMsg = "An error occurred while updating document status";
      console.error("Error updating document status:", error);
      setLastError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDocDeadline = async (documentId: string, deadline: Date | undefined): Promise<boolean> => {
    setIsUpdating(true);
    setLastError(null);
    
    try {
      let result: boolean;
      
      // For product documents, use the product service
      if (productId) {
        const service = new ProductDocumentService(productId, companyId);
        result = await service.updateDocumentDeadline(documentId, deadline);
      } else {
        // For company template documents, use unified API
        result = await updateDocumentDeadline(documentId, deadline || null);
      }
      
      if (result) {
        toast.success("Document deadline updated successfully");
      } else {
        const errorMsg = "Failed to update document deadline";
        setLastError(errorMsg);
        toast.error(errorMsg);
      }
      
      return result;
    } catch (error) {
      const errorMsg = "An error occurred while updating document deadline";
      console.error("Error updating document deadline:", error);
      setLastError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExclusion = async (documentId: string, exclude: boolean, reason?: string): Promise<boolean> => {
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const result = await toggleDocumentExclusion(documentId, exclude, reason);
      
      if (result) {
        toast.success(exclude ? "Document excluded successfully" : "Document inclusion restored");
      } else {
        const errorMsg = "Failed to toggle document exclusion";
        setLastError(errorMsg);
        toast.error(errorMsg);
      }
      
      return result;
    } catch (error) {
      const errorMsg = "An error occurred while toggling document exclusion";
      console.error("Error toggling document exclusion:", error);
      setLastError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    lastError,
    updateDocumentStatus: updateDocStatus,
    updateDocumentDeadline: updateDocDeadline,
    toggleDocumentExclusion: toggleExclusion
  };
};
