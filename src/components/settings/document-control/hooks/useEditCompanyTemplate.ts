import { useState } from "react";
import { toast } from "sonner";
import { DocumentItem } from "@/types/client";
import { CompanyTemplateService } from "@/services/companyTemplateService";

/**
 * Custom hook for editing company document templates
 */
export function useEditCompanyTemplate(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  setSelectedDocument: (doc: DocumentItem | null) => void
) {
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Handle editing a company template document
   */
  const handleEditTemplate = async (updatedDoc: DocumentItem): Promise<void> => {
    setIsEditing(true);
    try {
      console.log("useEditCompanyTemplate: Starting template edit for:", updatedDoc.name);
      
      // Find the original document
      const originalDoc = documents.find(doc => doc.id === updatedDoc.id);
      
      if (!originalDoc) {
        throw new Error("Document not found");
      }

      // Check what fields have changed
      const nameChanged = originalDoc.name !== updatedDoc.name;
      const typeChanged = originalDoc.type !== updatedDoc.type;
      const techApplicabilityChanged = originalDoc.techApplicability !== updatedDoc.techApplicability;
      const statusChanged = originalDoc.status !== updatedDoc.status;
      
      console.log("useEditCompanyTemplate: Changes detected:", {
        name: nameChanged,
        type: typeChanged,
        techApplicability: techApplicabilityChanged,
        status: statusChanged
      });

      // Update the template using the dedicated service
      const success = await CompanyTemplateService.updateTemplate(updatedDoc.id, {
        name: updatedDoc.name,
        type: updatedDoc.type,
        techApplicability: updatedDoc.techApplicability,
        status: updatedDoc.status
      });

      if (!success) {
        throw new Error("Failed to update template");
      }

      // Update UI state immediately with the complete updated document data
      const completeUpdatedDoc: DocumentItem = {
        ...originalDoc,
        ...updatedDoc,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const updatedDocuments = documents.map(doc => 
        doc.id === updatedDoc.id ? completeUpdatedDoc : doc
      );
      
      console.log("useEditCompanyTemplate: Updating documents state");
      
      setDocuments(updatedDocuments);
      setSelectedDocument(null); // Close the form after successful save
      
      console.log("useEditCompanyTemplate: Template edit completed successfully");
    } catch (error) {
      console.error("useEditCompanyTemplate: Error updating template:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update template";
      toast.error(errorMessage);
      // Don't close the form on error - keep it open so user can try again
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTemplate = async (documentId: string): Promise<void> => {
    setIsEditing(true);
    try {
      console.log("useEditCompanyTemplate: Starting template delete for:", documentId);
      
      const success = await CompanyTemplateService.deleteTemplate(documentId);

      if (!success) {
        throw new Error("Failed to delete template");
      }

      // Remove from UI state
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      setSelectedDocument(null);
      
      console.log("useEditCompanyTemplate: Template delete completed successfully");
    } catch (error) {
      console.error("useEditCompanyTemplate: Error deleting template:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete template";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  return {
    isEditing,
    handleEditTemplate,
    handleDeleteTemplate
  };
}
