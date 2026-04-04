
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCompanyDocumentTemplates(companyId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true);
  const [phases, setPhases] = useState<any[]>([]);
  const [documentsByPhase, setDocumentsByPhase] = useState<Record<string, any[]>>({});

  const fetchCompanyTemplates = async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get company's ACTIVE phases only from company_chosen_phases with strict company isolation
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            position
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        console.error("Error fetching company active phases:", phasesError);
        toast.error("Failed to load company phases");
        return;
      }

      // Transform the data to match the expected format
      const transformedPhases = (companyPhases || []).map(cp => ({
        id: (cp.company_phases as any).id,
        name: (cp.company_phases as any).name,
        description: (cp.company_phases as any).description,
        position: cp.position
      }));

      setPhases(transformedPhases || []);

      // Get all document templates for active company phases
      if (transformedPhases && transformedPhases.length > 0) {
        const phaseIds = transformedPhases.map(p => p.id);
        
        const { data: allDocuments, error: docsError } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .in('phase_id', phaseIds)
          .order('name');

        if (docsError) {
          console.error("Error fetching phase documents:", docsError);
          toast.error("Failed to load document templates");
          return;
        }

        // Group documents by phase
        const docsByPhase: Record<string, any[]> = {};
        transformedPhases.forEach(phase => {
          docsByPhase[phase.id] = (allDocuments || []).filter(doc => doc.phase_id === phase.id);
        });

        setDocumentsByPhase(docsByPhase);
      }

    } catch (error) {
      console.error("Error in fetchCompanyTemplates:", error);
      toast.error("Failed to load company document templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyTemplates();
  }, [companyId]);

  const getDocumentsForPhase = (phaseName: string): any[] => {
    const phase = phases.find(p => p.name === phaseName);
    return phase ? documentsByPhase[phase.id] || [] : [];
  };

  const addDocumentToPhase = async (phaseName: string, documentName: string, documentType: string = 'Standard'): Promise<boolean> => {
    if (!companyId) return false;

    try {
      const phase = phases.find(p => p.name === phaseName);
      if (!phase) {
        toast.error("Phase not found");
        return false;
      }

      const { error } = await supabase
        .from('phase_assigned_documents')
        .insert({
          phase_id: phase.id,
          name: documentName,
          status: 'Not Started',
          document_type: documentType
        });

      if (error) {
        console.error("Error adding document template:", error);
        toast.error("Failed to add document template");
        return false;
      }

      toast.success("Document template added successfully");
      await fetchCompanyTemplates(); // Refresh data
      return true;

    } catch (error) {
      console.error("Error in addDocumentToPhase:", error);
      toast.error("Failed to add document template");
      return false;
    }
  };

  const removeDocumentFromPhase = async (documentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error("Error removing document template:", error);
        toast.error("Failed to remove document template");
        return false;
      }

      toast.success("Document template removed successfully");
      await fetchCompanyTemplates(); // Refresh data
      return true;

    } catch (error) {
      console.error("Error in removeDocumentFromPhase:", error);
      toast.error("Failed to remove document template");
      return false;
    }
  };

  return {
    isLoading,
    phases,
    documentsByPhase,
    getDocumentsForPhase,
    addDocumentToPhase,
    removeDocumentFromPhase,
    refreshTemplates: fetchCompanyTemplates
  };
}
