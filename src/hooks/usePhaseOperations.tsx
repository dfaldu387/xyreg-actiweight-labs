
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePhaseOperations(productId: string | undefined, refreshData: () => void) {
  const [activeTab, setActiveTab] = useState("current");

  // Function to create missing phases for this product
  const createMissingPhase = async (phaseData: any) => {
    if (!phaseData.is_placeholder) return phaseData;
    
    try {
      // Remove placeholder properties
      const { is_placeholder, id: placeholderId, documents, ...newPhaseData } = phaseData;
      
      // Create the phase in the database
      const { data: createdPhase, error } = await supabase
        .from("lifecycle_phases")
        .insert({
          phase_id: newPhaseData.phase_id,
          name: newPhaseData.name, 
          description: newPhaseData.description,
          status: newPhaseData.status,
          deadline: newPhaseData.deadline,
          is_current_phase: newPhaseData.is_current_phase,
          progress: newPhaseData.progress,
          product_id: productId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating missing phase:", error);
        toast.error(`Failed to create ${newPhaseData.name} phase`);
        return phaseData;
      }
      
      console.log("Created missing phase:", createdPhase);
      return { ...createdPhase, documents: documents || [] };
    } catch (err) {
      console.error("Error in createMissingPhase:", err);
      return phaseData;
    }
  };

  const handlePhaseDeadlineChange = async (phaseId: string, date: Date | undefined, phases: any[], setPhases: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
      toast.loading("Updating phase deadline...");
      
      // Check if this is a placeholder phase that needs to be created first
      const phase = phases.find(p => p.id === phaseId || p.phase_id === phaseId);
      
      if (phase?.is_placeholder) {
        // Create the phase first
        const updatedPhase = {
          ...phase,
          deadline: date
        };
        
        const createdPhase = await createMissingPhase(updatedPhase);
        phaseId = createdPhase.id; // Use the new ID
        
        // Update phases list
        setPhases(phases.map(p => 
          (p.id === `placeholder-${phase.phase_id}`) ? createdPhase : p
        ));
        
        toast.dismiss();
        toast.success("Phase created and deadline set");
        return;
      }
      
      // Update existing phase
      const { error } = await supabase
        .from("lifecycle_phases")
        .update({ deadline: date ? date.toISOString() : null })
        .eq("id", phaseId);
        
      if (error) {
        console.error("Error updating phase deadline:", error);
        toast.dismiss();
        toast.error("Failed to update phase deadline");
        return;
      }
      
      toast.dismiss();
      toast.success("Phase deadline updated");
      refreshData();
    } catch (err) {
      console.error("Error in handlePhaseDeadlineChange:", err);
      toast.dismiss();
      toast.error("An error occurred while updating the phase deadline");
    }
  };

  const handleDocumentStatusChange = async (phaseId: string, documentId: string, status: string, phases: any[], setPhases: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
      toast.loading("Updating document status...");
      
      // Check if this is a placeholder phase that needs to be created first
      const phase = phases.find(p => p.id === phaseId || p.phase_id === phaseId);
      
      if (phase?.is_placeholder) {
        // Create the phase first
        const createdPhase = await createMissingPhase(phase);
        phaseId = createdPhase.id; // Use the new ID
        
        // Update phases list
        setPhases(phases.map(p => 
          (p.id === `placeholder-${phase.phase_id}`) ? createdPhase : p
        ));
      }
      
      // Update document in phase_assigned_documents
      const { error: phaseDocError } = await supabase
        .from('phase_assigned_documents')
        .update({ status })
        .eq('id', documentId);
        
      if (phaseDocError) {
        console.error("Error updating phase document status:", phaseDocError);
      }
      
      // Also update document in documents table
      const { error: docError } = await supabase
        .from('documents')
        .update({ status })
        .eq('product_id', productId)
        .eq('id', documentId);
      
      // If document ID doesn't match, try to find by name
      if (docError) {
        // Get the document name from phase_assigned_documents
        const { data: docData } = await supabase
          .from('phase_assigned_documents')
          .select('name')
          .eq('id', documentId)
          .single();
          
        if (docData?.name) {
          // Update document by name
          const { error } = await supabase
            .from('documents')
            .update({ status })
            .eq('product_id', productId)
            .eq('name', docData.name);
            
          if (error) {
            console.error("Error updating document by name:", error);
          }
        }
      }
      
      toast.dismiss();
      toast.success(`Document marked as ${status}`);
      refreshData();
    } catch (err) {
      console.error("Error in handleDocumentStatusChange:", err);
      toast.dismiss();
      toast.error("An error occurred while updating the document");
    }
  };

  const handleDocumentDeadlineChange = async (phaseId: string, documentId: string, date: Date | undefined, phases: any[], setPhases: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
      toast.loading("Updating document deadline...");
      
      // Check if this is a placeholder phase that needs to be created first
      const phase = phases.find(p => p.id === phaseId || p.phase_id === phaseId);
      
      if (phase?.is_placeholder) {
        // Create the phase first
        const createdPhase = await createMissingPhase(phase);
        phaseId = createdPhase.id; // Use the new ID
        
        // Update phases list
        setPhases(phases.map(p => 
          (p.id === `placeholder-${phase.phase_id}`) ? createdPhase : p
        ));
      }
      
      const { error } = await supabase
        .from('phase_assigned_documents')
        .update({ 
          deadline: date ? date.toISOString() : null 
        })
        .eq('id', documentId);
      
      if (error) {
        console.error("Error updating document deadline:", error);
        toast.dismiss();
        toast.error("Failed to update document deadline");
        return;
      }
      
      toast.dismiss();
      toast.success(date ? "Document deadline updated" : "Document deadline removed");
      refreshData();
    } catch (err) {
      console.error("Error in handleDocumentDeadlineChange:", err);
      toast.dismiss();
      toast.error("An error occurred while updating the document deadline");
    }
  };

  return {
    activeTab,
    setActiveTab,
    handlePhaseDeadlineChange,
    handleDocumentStatusChange,
    handleDocumentDeadlineChange,
  };
}
