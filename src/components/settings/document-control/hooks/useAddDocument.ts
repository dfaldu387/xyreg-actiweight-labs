
import { useState } from "react";
import { toast } from "sonner";
import { DocumentItem, ReviewerItem } from "@/types/client";
import { DocumentTechApplicability } from "@/types/documentTypes";
import { DocumentCreationService } from "@/services/documentCreationService";

/**
 * Custom hook for adding new documents with proper scope handling
 */
export function useAddDocument(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  setShowAddForm: (show: boolean) => void,
  companyId?: string,
  documentScope: 'catalog' | 'company_template' | 'product_document' = 'catalog'
) {
  const [isAdding, setIsAdding] = useState(false);

  /**
   * Handle adding a new document with proper scope routing
   */
  const handleAddDocument = async (
    document: Omit<DocumentItem, "id" | "reviewers"> & { 
      id?: string, 
      reviewers?: ReviewerItem[], 
      techApplicability?: DocumentTechApplicability,
      phaseId?: string,
      productId?: string
    }
  ): Promise<void> => {
    setIsAdding(true);
    try {
      // Check if document with this name already exists in current scope
      const existingDoc = documents.find(doc => doc.name.toLowerCase() === document.name.toLowerCase());
      if (existingDoc) {
        toast.error(`A document with the name "${document.name}" already exists`);
        return;
      }
      
      console.log("Adding document with scope:", documentScope, document);
      
      // Map legacy scope to new service scopes
      let serviceScope: 'company_template' | 'product_document' | 'company_document';
      switch (documentScope) {
        case 'company_template':
          serviceScope = 'company_template';
          break;
        case 'product_document':
          serviceScope = 'product_document';
          break;
        default:
          serviceScope = 'company_document';
          break;
      }
      
      const newDocumentId = await DocumentCreationService.createDocument({
        name: document.name,
        description: document.description,
        documentType: document.type,
        scope: serviceScope,
        companyId: companyId,
        productId: document.productId,
        phaseId: document.phaseId,
        techApplicability: document.techApplicability
      });
      
      if (!newDocumentId) {
        return; // Error already handled by service
      }
      
      // Create a document object for UI state
      const newDocument: DocumentItem = {
        id: newDocumentId,
        name: document.name,
        type: document.type,
        description: document.description || "",
        status: document.status || "Draft",
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        phases: document.phases || [],
        reviewers: document.reviewers || [],
        techApplicability: document.techApplicability
      };
      
      // Update UI state
      setDocuments([...documents, newDocument]);
      setShowAddForm(false);
      
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    } finally {
      setIsAdding(false);
    }
  };

  return {
    isAdding,
    handleAddDocument
  };
}
