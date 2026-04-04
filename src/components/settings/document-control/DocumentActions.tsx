import { useState } from "react";
import { DocumentItem } from "@/types/client";
import { DocumentTechApplicability } from "@/types/documentTypes";
import { InclusionRule } from "@/types/documentInclusion";
import { toast } from "sonner";
import { useAddDocument } from "./hooks/useAddDocument";
import { useDeleteDocument } from "./hooks/useDeleteDocument";
import { useEditDocument } from "./hooks/useEditDocument";
import { useReviewers } from "./hooks/useReviewers";
import { DocumentInclusionService } from "@/services/documentInclusionService";
import { CompanyDocumentTemplateService } from "@/services/companyDocumentTemplateService";

export function useDocumentActions(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  setSelectedDocument: (doc: DocumentItem | null) => void,
  setShowAddForm: (show: boolean) => void,
  companyId?: string,
  documentScope: 'catalog' | 'company_template' | 'product_document' = 'catalog'
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the updated useAddDocument hook with scope support
  const { handleAddDocument: addDocumentHook } = useAddDocument(
    documents,
    setDocuments,
    setShowAddForm,
    companyId,
    documentScope
  );

  const { handleDeleteDocument: deleteDocumentHook } = useDeleteDocument(
    documents,
    setDocuments
  );

  const { handleEditDocument: editDocumentHook, isEditing } = useEditDocument(
    documents,
    setDocuments,
    setSelectedDocument
  );

  const { handleUpdateReviewers: updateReviewersHook } = useReviewers(
    documents,
    setDocuments
  );

  const handleInclusionRuleChange = async (
    documentId: string, 
    rule: InclusionRule
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      console.log("[DocumentActions] Updating inclusion rule for document:", documentId);
      
      let tableName: 'documents' | 'phase_assigned_documents' | 'company_document_templates';
      
      switch (documentScope) {
        case 'catalog':
          tableName = 'documents';
          break;
        case 'company_template':
          tableName = 'phase_assigned_documents';
          break;
        case 'product_document':
          tableName = 'documents';
          break;
      }
      
      const success = await DocumentInclusionService.updateInclusionRule(
        documentId, 
        rule, 
        tableName
      );
      
      if (success) {
        // Update local state
        const updatedDocuments = documents.map(doc => 
          doc.id === documentId 
            ? { ...doc, inclusion_rules: rule }
            : doc
        );
        setDocuments(updatedDocuments);
        console.log("[DocumentActions] Inclusion rule updated successfully");
      }
    } catch (error) {
      console.error("[DocumentActions] Error updating inclusion rule:", error);
      toast.error('Failed to update inclusion settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      setIsSubmitting(true);
      console.log("[DocumentActions] Starting document deletion for:", docId);
      
      // Check if document is protected before attempting deletion
      const document = documents.find(doc => doc.id === docId);
      if (document?.is_protected) {
        toast.error('Cannot delete protected document');
        return;
      }
      
      // For company templates, use the simplified service
      if (documentScope === 'company_template') {
        console.log("[DocumentActions] Deleting company template");
        const success = await CompanyDocumentTemplateService.deleteTemplate(docId);
        
        if (success) {
          // Remove from UI state
          const updatedDocuments = documents.filter(doc => doc.id !== docId);
          setDocuments(updatedDocuments);
          setSelectedDocument(null);
          console.log("[DocumentActions] Company template deleted and UI updated");
        }
      } else {
        // Use regular delete for other document types
        console.log("[DocumentActions] Using regular delete hook");
        await deleteDocumentHook(docId);
      }
    } catch (error) {
      console.error("[DocumentActions] Error deleting document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDocument = async (updatedDoc: DocumentItem): Promise<void> => {
    try {
      setIsSubmitting(true);
      console.log("[DocumentActions] Starting edit for document:", updatedDoc.name);
      console.log("[DocumentActions] Document scope:", documentScope);
      
      // Use the simplified edit hook (which now handles company templates correctly)
      await editDocumentHook(updatedDoc);
      console.log("[DocumentActions] Edit completed successfully");
      
    } catch (error) {
      console.error("[DocumentActions] Error editing document:", error);
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDocument = async (newDoc: DocumentItem & { phaseId?: string, productId?: string }): Promise<void> => {
    try {
      setIsSubmitting(true);
      console.log("[DocumentActions] Starting document addition");
      
      const docToAdd = {
        name: newDoc.name,
        type: newDoc.type,
        description: newDoc.description,
        status: newDoc.status,
        version: newDoc.version,
        lastUpdated: newDoc.lastUpdated,
        phases: newDoc.phases,
        reviewers: newDoc.reviewers || [],
        techApplicability: newDoc.techApplicability as DocumentTechApplicability,
        phaseId: newDoc.phaseId,
        productId: newDoc.productId
      };
      
      await addDocumentHook(docToAdd);
      console.log("[DocumentActions] Document addition completed");
      
    } catch (error) {
      console.error("[DocumentActions] Error adding document:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReviewers = async (docId: string, reviewers: any[]) => {
    try {
      setIsSubmitting(true);
      console.log("[DocumentActions] Starting reviewers update");
      await updateReviewersHook(docId, reviewers);
    } catch (error) {
      console.error("[DocumentActions] Error updating reviewers:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddButtonClick = () => {
    console.log("[DocumentActions] Add button clicked for scope:", documentScope);
    setSelectedDocument(null);
    setShowAddForm(true);
  };

  return {
    handleDeleteDocument,
    handleEditDocument,
    handleAddDocument,
    handleUpdateReviewers,
    handleInclusionRuleChange,
    handleAddButtonClick,
    isSubmitting: isSubmitting || isEditing
  };
}
