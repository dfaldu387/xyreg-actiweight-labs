import { useState } from "react";
import { toast } from "sonner";
import { DocumentItem } from "@/types/client";
import { CompanyDocumentTemplateService } from "@/services/companyDocumentTemplateService";

/**
 * Custom hook for editing documents in company settings
 * Simplified to always use the CompanyDocumentTemplateService since we're in company settings context
 */
export function useEditDocument(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  setSelectedDocument: (doc: DocumentItem | null) => void
) {
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Handle editing an existing document in company settings
   * Always uses CompanyDocumentTemplateService since all documents here are company templates
   */
  const handleEditDocument = async (updatedDoc: DocumentItem): Promise<void> => {
    setIsEditing(true);
    try {
      console.log("[useEditDocument] Starting document edit for:", updatedDoc.name);
      console.log("[useEditDocument] Document ID:", updatedDoc.id);
      console.log("[useEditDocument] Updated document data:", updatedDoc);
      console.log("[useEditDocument] Document type being saved:", updatedDoc.type);
      
      // Find the document being updated
      const originalDoc = documents.find(doc => doc.id === updatedDoc.id);
      
      if (!originalDoc) {
        console.error("[useEditDocument] Original document not found in documents array");
        toast.error("Document not found");
        throw new Error("Document not found");
      }

      console.log("[useEditDocument] Original document:", originalDoc);

      // Since we're in company settings, all documents are company templates
      // Always use the CompanyDocumentTemplateService
      console.log("[useEditDocument] Using CompanyDocumentTemplateService for template update");
      
      const updateData = {
        name: updatedDoc.name,
        document_type: updatedDoc.type,
        tech_applicability: updatedDoc.techApplicability,
        description: updatedDoc.description || "",
        file_path: updatedDoc.file_path,
        file_name: updatedDoc.file_name,
        file_size: updatedDoc.file_size,
        file_type: updatedDoc.file_type,
        uploaded_at: updatedDoc.uploaded_at,
        uploaded_by: updatedDoc.uploaded_by
      };

      console.log("[useEditDocument] Sending update data to service:", updateData);
      
      const success = await CompanyDocumentTemplateService.updateTemplate(updatedDoc.id, updateData);

      if (!success) {
        console.error("[useEditDocument] CompanyDocumentTemplateService.updateTemplate returned false");
        throw new Error("Failed to update template - service returned false");
      }

      console.log("[useEditDocument] Template updated successfully by service");
      
      // Create the complete updated document data for UI state
      const completeUpdatedDoc: DocumentItem = {
        ...originalDoc,
        name: updatedDoc.name,
        type: updatedDoc.type,
        techApplicability: updatedDoc.techApplicability,
        description: updatedDoc.description,
        phases: updatedDoc.phases,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      console.log("[useEditDocument] Updating UI state with:", completeUpdatedDoc);
      console.log("[useEditDocument] Updated document type in UI:", completeUpdatedDoc.type);

      // Update UI state immediately
      const updatedDocuments = documents.map(doc => 
        doc.id === updatedDoc.id ? completeUpdatedDoc : doc
      );
      
      setDocuments(updatedDocuments);
      setSelectedDocument(null); // Close the form only after successful save
      
      console.log("[useEditDocument] UI state updated successfully");
      console.log("[useEditDocument] Document edit completed successfully");
      
    } catch (error) {
      console.error("[useEditDocument] Error updating document:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update document";
      toast.error(errorMessage);
      // Don't close the form on error - keep it open so user can try again
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  return {
    isEditing,
    handleEditDocument
  };
}
