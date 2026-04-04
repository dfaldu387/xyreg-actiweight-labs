
import { DropResult } from "@hello-pangea/dnd";
import { DocumentItem } from "@/types/client";
import { updateDocumentPhases, removeDocumentAssignmentByPhaseName } from "./documentOperations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const createDragEndHandler = (
  filteredDocuments: DocumentItem[],
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  phaseOrder: string[],
  onDocumentUpdated?: (document: DocumentItem) => void
) => {
  return async (result: DropResult) => {
    console.log("[DragHandlers] Drag operation started:", {
      result,
      timestamp: new Date().toISOString()
    });
    
    const { destination, source, draggableId } = result;
    
    if (!destination) {
      console.log("[DragHandlers] No destination - drag cancelled");
      return;
    }
    
    // If dropped in the same location, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log("[DragHandlers] Dropped in same location - no action needed");
      return;
    }
    
    // Extract document index from draggable ID
    const indexMatch = draggableId.match(/^doc-(\d+)$/);
    if (!indexMatch) {
      console.error("[DragHandlers] Invalid draggable ID format:", draggableId);
      toast.error("Invalid document ID format");
      return;
    }
    
    const documentIndex = parseInt(indexMatch[1], 10);
    const draggedDocument = filteredDocuments[documentIndex];
    
    if (!draggedDocument) {
      console.error("[DragHandlers] Document not found at index:", documentIndex);
      toast.error("Document not found");
      return;
    }
    
    console.log("[DragHandlers] Document identified:", {
      name: draggedDocument.name,
      currentPhases: draggedDocument.phases,
      index: documentIndex
    });
    
    // Handle assignment to phase
    if (destination.droppableId.startsWith("phase-")) {
      const extractedPhaseName = destination.droppableId.replace("phase-", "");
      console.log("[DragHandlers] Target phase extracted:", extractedPhaseName);
      
      // Validate that the extracted phase name exists in our phase order
      if (!phaseOrder.includes(extractedPhaseName)) {
        console.error("[DragHandlers] Phase name not found in phaseOrder:", {
          extractedPhaseName,
          availablePhases: phaseOrder
        });
        toast.error(`Invalid phase: ${extractedPhaseName}`);
        return;
      }
      
      const phaseName = extractedPhaseName;
      
      // Check if this document is already assigned to this phase
      const isAlreadyAssigned = draggedDocument.phases?.includes(phaseName);
      
      if (isAlreadyAssigned) {
        console.log("[DragHandlers] Document already assigned to phase:", phaseName);
        toast.info(`Document "${draggedDocument.name}" is already assigned to ${phaseName}`);
        return;
      }
      
      // Add the phase to the document (preserve existing phases)
      const newPhases = [...(draggedDocument.phases || []), phaseName];
      
      try {
        console.log(`[DragHandlers] Assigning document "${draggedDocument.name}" to phase "${phaseName}"`);
        console.log(`[DragHandlers] New phases will be:`, newPhases);
        
        // Show immediate feedback
        const loadingToast = toast.loading(`Assigning "${draggedDocument.name}" to ${phaseName}...`);
        
        // Extract document properties from the dragged document
        const documentProperties = {
          document_type: draggedDocument.type || 'Standard',
          file_path: (draggedDocument as any).file_path || '',
          file_name: (draggedDocument as any).file_name || '',
          file_size: (draggedDocument as any).file_size || 0,
          file_type: (draggedDocument as any).file_type || '',
          public_url: (draggedDocument as any).public_url || null
        };
        
        console.log('[DragHandlers] Passing document properties:', documentProperties);
        
        // Update in database with enhanced logging
        const success = await updateDocumentPhases(draggedDocument.name, newPhases, documentProperties);
        
        toast.dismiss(loadingToast);
        
        if (success) {
          console.log(`[DragHandlers] Database update successful, updating local state`);
          
          // Update local state - update all instances with this name
          const updatedDocuments = documents.map(doc => {
            if (doc.name === draggedDocument.name) {
              const updatedDoc = { ...doc, phases: newPhases };
              console.log(`[DragHandlers] Updated document in state:`, updatedDoc);
              return updatedDoc;
            }
            return doc;
          });
          
          console.log(`[DragHandlers] Setting updated documents array, total count:`, updatedDocuments.length);
          setDocuments(updatedDocuments);
          
          toast.success(`Document assigned to ${phaseName}`, {
            description: `"${draggedDocument.name}" is now available in ${phaseName}`
          });
          
          if (onDocumentUpdated) {
            console.log(`[DragHandlers] Calling onDocumentUpdated callback`);
            onDocumentUpdated({ ...draggedDocument, phases: newPhases });
          }
        } else {
          console.error(`[DragHandlers] Database update failed`);
          toast.error("Failed to assign document to phase", {
            description: "Please check your permissions and try again"
          });
        }
      } catch (error: any) {
        console.error("[DragHandlers] Error in drag operation:", error);
        toast.error("Error assigning document to phase", {
          description: error.message || "Unknown error occurred"
        });
      }
    } else {
      console.log("[DragHandlers] Destination is not a phase drop zone:", destination.droppableId);
    }
  };
};

export const createRemoveDocumentHandler = (
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  onDocumentUpdated?: (document: DocumentItem) => void
) => {
  return async (document: DocumentItem, phaseName: string) => {
    console.log(`[DragHandlers] Removing document "${document.name}" from phase "${phaseName}"`);
    
    try {
      await removeDocumentAssignmentByPhaseName(phaseName, document.name, '');
      
      // Update local state - remove the document from the specific phase
      const updatedDocuments = documents.map(doc => {
        if (doc.name === document.name) {
          const updatedPhases = (doc.phases || []).filter(phase => phase !== phaseName);
          return { ...doc, phases: updatedPhases };
        }
        return doc;
      });
      
      setDocuments(updatedDocuments);
      toast.success(`Document removed from ${phaseName}`, {
        description: "Document remains available in library"
      });
      
      if (onDocumentUpdated) {
        const updatedPhases = (document.phases || []).filter(phase => phase !== phaseName);
        onDocumentUpdated({ ...document, phases: updatedPhases });
      }
    } catch (error) {
      console.error("[DragHandlers] Error removing document from phase:", error);
      toast.error("Error removing document from phase");
    }
  };
};

export const createDeleteDocumentHandler = (
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  companyId?: string
) => {
  return async (document: DocumentItem) => {
    console.log("[DragHandlers] Deleting document template:", document.name);
    
    if (!companyId) {
      toast.error("Company ID is required to delete document");
      return;
    }
    
    try {
      // Use the safe deletion function that handles foreign key constraints
      const { data, error } = await supabase.rpc('safely_delete_document_template', {
        template_id_param: document.id
      });
      
      if (error) {
        console.error("[DragHandlers] Error deleting document template:", error);
        toast.error(`Error deleting document template: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error("Failed to delete document template");
        return;
      }
      
      // Remove from local state
      const updatedDocuments = documents.filter(doc => doc.id !== document.id);
      setDocuments(updatedDocuments);
      
      toast.success(`Document template deleted`, {
        description: `"${document.name}" has been completely removed`
      });
    } catch (error) {
      console.error("[DragHandlers] Error deleting document template:", error);
      toast.error(`Error deleting document template "${document.name}"`);
    }
  };
};
