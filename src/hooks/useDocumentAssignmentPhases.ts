
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentItem } from '@/types/client';

interface DocumentAssignmentPhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  documents: Array<{
    id: string;
    name: string;
    status: string;
    document_type: string;
    tech_applicability?: string;
    created_at?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    public_url?: string;
  }>;
}

// Type guard to check if the data is valid and not an error
function isValidPhaseData(data: any): data is { company_phases: any; position?: number } {
  return data && typeof data === 'object' && data.company_phases && typeof data.company_phases === 'object';
}

// Type guard to check if company_phases has the required properties
function hasRequiredPhaseProperties(companyPhases: any): companyPhases is {
  id: string;
  name: string;
  company_id: string;
  description?: string;
  category_id?: string;
} {
  return companyPhases &&
    typeof companyPhases.id === 'string' &&
    typeof companyPhases.name === 'string' &&
    typeof companyPhases.company_id === 'string';
}

export function useDocumentAssignmentPhases(companyId: string) {
  const [phases, setPhases] = useState<DocumentAssignmentPhase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allDocumentTemplates, setAllDocumentTemplates] = useState<DocumentItem[]>([]);
  const fetchAllDocuments = useCallback(async () => {
    try {
      // Fetch from company_document_templates table
      const { data: templateData, error: templateError } = await supabase
        .from('company_document_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_user_removed', false);

      if (templateError) {
        console.error("Error fetching company document templates:", templateError);
      }

      // Fetch from documents table where document_scope = 'company_document'
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document');

      if (documentError) {
        console.error("Error fetching company documents:", documentError);
      }

      // Fetch from phase_assigned_document_template (SOP + Standard docs assigned to company phases)
      // First get all phase IDs belonging to this company
      const { data: companyPhaseIds } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId);

      let phaseAssignedDocs: any[] = [];
      if (companyPhaseIds && companyPhaseIds.length > 0) {
        const phaseIds = companyPhaseIds.map(p => p.id);
        const { data: paDocs, error: paError } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .in('document_scope', ['company_template', 'company_document'])
          .in('phase_id', phaseIds);

        if (paError) {
          console.error("Error fetching phase-assigned documents:", paError);
        } else {
          phaseAssignedDocs = paDocs || [];
        }
      }

      // Combine all datasets, dedup by name, merging section data from later duplicates
      const seenNames = new Map<string, any>();
      const allDocuments: any[] = [];

      for (const doc of [...(templateData || []), ...(documentData || []), ...phaseAssignedDocs]) {
        if (!seenNames.has(doc.name)) {
          seenNames.set(doc.name, doc);
          allDocuments.push(doc);
        } else {
          // Merge section fields from duplicates if the first occurrence lacks them
          const existing = seenNames.get(doc.name);
          if (!existing.sub_section && doc.sub_section) {
            existing.sub_section = doc.sub_section;
          }
          if ((!existing.section_ids || existing.section_ids.length === 0) && doc.section_ids && doc.section_ids.length > 0) {
            existing.section_ids = doc.section_ids;
          }
        }
      }

      setAllDocumentTemplates(allDocuments as unknown as DocumentItem[]);
    } catch (error) {
      console.error("Error in fetchAllDocuments:", error);
      setAllDocumentTemplates([]);
    }
  }, [companyId]);
  const fetchDocumentAssignmentPhases = useCallback(async (silent: boolean = false) => {
    if (!companyId) return;

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Try to query with new columns first, fall back to basic columns if they don't exist
      let useExtendedQuery = false;

      // Test if new columns exist
      try {
        const { error: testError } = await supabase
          .from('company_chosen_phases')
          .select(`
            position,
            company_phases!inner(
              id,
              name,
              description,
              company_id,
              category_id,
              is_active
            )
          `)
          .eq('company_id', companyId)
          .limit(1);

        useExtendedQuery = !testError;
      } catch (e) {
        useExtendedQuery = false;
      }

      // Use appropriate query based on column availability
      const selectQuery = useExtendedQuery ? `
        position,
        company_phases!inner(
          id,
          name,
          description,
          company_id,
          category_id,
          is_active,
          is_continuous_process,
          compliance_section_ids
        )
      ` : `
        position,
        company_phases!inner(
          id,
          name,
          description,
          company_id,
          category_id,
          is_continuous_process,
          compliance_section_ids
        )
      `;


      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(selectQuery)
        .eq('company_id', companyId)
        .order('position');
      if (chosenError) {
        console.error('[useDocumentAssignmentPhases] Error fetching chosen phases:', chosenError);
        throw chosenError;
      }

      if (!chosenPhases || chosenPhases.length === 0) {
        setPhases([]);
        return;
      }

      // Get the phase IDs from company_phases
      const phaseIds = chosenPhases
        .filter(isValidPhaseData)
        .filter(cp => hasRequiredPhaseProperties(cp.company_phases))
        .map(cp => cp.company_phases.id);

      if (phaseIds.length === 0) {
        setPhases([]);
        return;
      }
      // Get documents for each phase using the phase_assigned_documents table WITH created_at AND file info
      const { data: documents, error: docsError } = await supabase
        .from('phase_assigned_document_template')
        .select('id, phase_id, name, document_type, tech_applicability, status, created_at, file_path, file_name, file_size, file_type, public_url, sub_section, section_ids')
        .eq('is_excluded', false)
        .eq('document_scope', 'company_template')
        .in('phase_id', phaseIds);

      if (docsError) {
        console.error('[useDocumentAssignmentPhases] Error fetching documents:', docsError);
        throw docsError;
      }

      // Build the phase data with current phase names and their documents INCLUDING created_at
      const phasesWithDocuments: DocumentAssignmentPhase[] = chosenPhases
        .filter(isValidPhaseData)
        .filter(cp => hasRequiredPhaseProperties(cp.company_phases))
        .map(chosenPhase => {
          const companyPhasesRaw = chosenPhase.company_phases;
          const companyPhases = Array.isArray(companyPhasesRaw) ? companyPhasesRaw[0] : companyPhasesRaw;

          const phaseDocuments = documents?.filter(doc => doc.phase_id === companyPhases.id) || [];

          return {
            id: companyPhases.id,
            name: companyPhases.name, // This ensures we use the CURRENT name from company_phases table
            description: companyPhases.description,
            position: chosenPhase.position || 0,
            is_continuous_process: companyPhases.is_continuous_process ?? false,
            compliance_section_ids: companyPhases.compliance_section_ids || [],
            documents: phaseDocuments.map(doc => {
              const mappedDoc = {
                id: doc.id,
                name: doc.name,
                status: doc.status || 'Not Started',
                document_type: doc.document_type || 'Standard',
                tech_applicability: doc.tech_applicability,
                created_at: doc.created_at,
                file_path: doc.file_path,
                file_name: doc.file_name,
                file_size: doc.file_size,
                file_type: doc.file_type,
                public_url: doc.public_url,
                sub_section: doc.sub_section || null,
                section_ids: doc.section_ids || null
              };
              return mappedDoc;
            })
          };
        });

      setPhases(phasesWithDocuments);
    } catch (error) {
      console.error('[useDocumentAssignmentPhases] Error loading document assignment phases:', error);
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Failed to load document assignment phases');
        toast.error('Failed to load document assignment phases');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [companyId]);
  // Update the phase data when a document is updated
  const updatePhaseDocumentData = useCallback(async (phaseId: string, documentId: string, updatedData: any) => {
    const { data, error } = await supabase
      .from('company_document_templates')
      .update(updatedData)
      .eq('id', documentId)
      // .eq('phase_id', phaseId);
      .select('*')
    // .single();
    if (error) {
      console.error('Failed to update phase data', error);
      toast.error('Failed to update phase data');
    } else {
      toast.success('Document updated successfully');
    }
  }, []);
  const updateProductDocumentData = useCallback(async (productId: string, documentId: string, updatedData: any) => {
    const { data, error } = await supabase
      .from('documents')
      .update(updatedData)
      .eq('id', documentId)
      .select('*')
      .single();
    if (error) {
      console.error('Failed to update product document', error);
      toast.error('Failed to update product document');
    } else {
      toast.success('Document updated successfully');
    }
  }, []);

  const refreshPhases = useCallback(() => {
    fetchDocumentAssignmentPhases();
  }, [fetchDocumentAssignmentPhases]);

  const refreshPhasesSilent = useCallback(() => {
    fetchDocumentAssignmentPhases(true);
  }, [fetchDocumentAssignmentPhases]);

  const deletePhaseDocumentData = useCallback(async (documentId: string) => {
    const { data, error } = await supabase
      .from('company_document_templates')
      .update(
        {
          is_user_removed: true
        }
      )
      .eq('id', documentId);

    if (error) {
      toast.error('Failed to delete phase document');
    } else {
      toast.success('Document deleted successfully');
      // Refresh silently without loading state
      refreshPhasesSilent();
    }

  }, [refreshPhasesSilent]);

  useEffect(() => {
    fetchDocumentAssignmentPhases();
  }, [fetchDocumentAssignmentPhases]);

  return {
    phases,
    isLoading,
    error,
    refreshPhases,
    refreshPhasesSilent,
    allDocumentTemplates,
    fetchAllDocuments,
    updatePhaseDocumentData,
    deletePhaseDocumentData,
    updateProductDocumentData,
  };
}
