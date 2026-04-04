
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhaseDocument } from '@/types/phaseDocuments';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook for basic document CRUD operations
 */
export const useDocumentCrud = (phaseId: string, documents: PhaseDocument[], setDocuments: (docs: PhaseDocument[]) => void) => {
  const [operationInProgress, setOperationInProgress] = useState(false);
  const { user, userRole } = useAuth();

  /**
   * Checks if a document with the given name already exists for this phase
   */
  const documentExists = async (documentName: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('phase_assigned_documents')
      .select('name')
      .eq('phase_id', phaseId)
      .eq('name', documentName.trim());

    if (error) {
      console.error('Error checking if document exists:', error);
      return false;
    }

    return data && data.length > 0;
  };

  /**
   * Check if user has permission to manage documents
   */
  const checkPermission = (): boolean => {
    // Allow consultant, company_admin, and company_editor roles to manage documents
    return ['consultant', 'company_admin', 'company_editor'].includes(userRole || '');
  };

  /**
   * Add document to phase
   */
  const addDocument = async (documentName: string, documentType: string = 'Standard'): Promise<string | null> => {
    try {
      setOperationInProgress(true);
      
      if (!documentName.trim()) {
        toast.error('Document name cannot be empty');
        return null;
      }

      // Check if user has permission
      if (!checkPermission()) {
        toast.error('You do not have permission to add documents');
        return null;
      }

      // Check if document already exists
      const exists = await documentExists(documentName);
      if (exists) {
        toast.error('This document already exists for this phase');
        return null;
      }

      // Also check if the document is excluded
      const { data: excludedData, error: excludedError } = await supabase
        .from('excluded_documents')
        .select('id')
        .eq('phase_id', phaseId)
        .eq('document_name', documentName.trim());
        
      if (excludedError) {
        console.error('Error checking excluded documents:', excludedError);
      }
      
      // If document is excluded, remove it from exclusion list first
      if (excludedData && excludedData.length > 0) {
        console.log(`Document ${documentName} was excluded, removing from exclusion list`);
        const { error: removeError } = await supabase
          .from('excluded_documents')
          .delete()
          .eq('phase_id', phaseId)
          .eq('document_name', documentName.trim());
          
        if (removeError) {
          console.error('Error removing document from excluded list:', removeError);
          toast.error('Failed to update document exclusion status');
          return null;
        }
      }

      // Insert document into database
      const { data, error } = await supabase
        .from('phase_assigned_documents')
        .insert({
          phase_id: phaseId,
          name: documentName.trim(),
          status: 'Not Started',
          document_type: documentType
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding document:', error);
        if (error.code === '23503') {
          toast.error('Failed to add document: Foreign key constraint error. The phase may not exist.');
        } else {
          toast.error('Failed to add document');
        }
        return null;
      }
      
      // Convert the data to match PhaseDocument interface
      const newDoc: PhaseDocument = {
        id: data.id,
        name: data.name,
        status: data.status as "Completed" | "In Progress" | "Not Started" | "Not Required",
        type: data.document_type,
        phases: Array.isArray(data.phases) ? data.phases.map(p => String(p)) : [],
        classes: Array.isArray(data.classes) ? data.classes.map(c => String(c)) : [],
        deadline: data.deadline
      };
      
      // Update local state
      setDocuments([...documents, newDoc]);
      toast.success('Document added successfully');
      return data.id;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
      return null;
    } finally {
      setOperationInProgress(false);
    }
  };

  /**
   * Remove document from phase
   */
  const removeDocument = async (documentId: string): Promise<boolean> => {
    try {
      setOperationInProgress(true);
      
      // Check if user has permission
      if (!checkPermission()) {
        toast.error('You do not have permission to remove documents');
        return false;
      }
      
      // First, get the document to identify it by name
      const documentToRemove = documents.find(doc => doc.id === documentId);
      if (!documentToRemove) {
        toast.error('Document not found');
        return false;
      }
      
      // Delete from phase_assigned_documents
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error removing document:', error);
        toast.error('Failed to remove document');
        return false;
      }
      
      // Remove from excluded_documents if it exists there
      const { error: excludedError } = await supabase
        .from('excluded_documents')
        .delete()
        .eq('phase_id', phaseId)
        .eq('document_name', documentToRemove.name);
        
      if (excludedError) {
        console.error('Error removing document from excluded_documents:', excludedError);
        // Continue execution as this is not critical
      }
      
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success('Document removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
      return false;
    } finally {
      setOperationInProgress(false);
    }
  };

  return {
    addDocument,
    removeDocument,
    operationInProgress
  };
};
