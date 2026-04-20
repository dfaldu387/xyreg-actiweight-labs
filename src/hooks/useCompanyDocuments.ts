import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isValidUUID } from '@/utils/uuidValidation';
import { AuditTrailService } from '@/services/auditTrailService';

export interface CompanyDocument {
  id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  description?: string;
  file_name?: string;
  file_size?: number;
  file_path?: string;
  uploaded_at?: string;
  created_at: string;
  updated_at: string;
  reviewer_group_ids?: string[] | null;
  // Compliance fields
  sub_section?: string | null;
  section_ids?: string[] | null;
  document_reference?: string | null;
  version?: string | null;
  date?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  phase_id?: string | null;
  phase_name?: string | null;
  is_current_effective_version?: boolean;
  brief_summary?: string | null;
  author?: string | null;
  authors_ids?: string[] | null;
  need_template_update?: boolean;
  is_record?: boolean;
  source_table?: 'documents' | 'phase_assigned_document_template' | 'document_studio_templates';
  reference_document_ids?: string[] | null;
  approval_date?: string | null;
  approved_by?: string | null;
  approval_note?: string | null;
  tags?: string[];
  document_number?: string | null;
}

export function useCompanyDocuments(companyId: string) {
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company-documents', companyId],
    queryFn: async (): Promise<CompanyDocument[]> => {
      try {
        // Get current user for access check
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Could not get current user for admin assignment');
        }

        // Query phase_assigned_document_template table for company-specific documents
        // Fetch phase names separately since FK may point to different tables
        const { data: documentsData, error: documentsError } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .eq('company_id', companyId)
          .eq('document_scope', 'company_document')
          .order('created_at', { ascending: false });

        // Fetch phase name lookup
        const phaseIds = [...new Set((documentsData || []).map((d: any) => d.phase_id).filter(Boolean))];
        let phaseNameMap = new Map<string, string>();
        if (phaseIds.length > 0) {
          // Try company_phases first
          const { data: cpData } = await supabase
            .from('company_phases')
            .select('id, name')
            .in('id', phaseIds);
          if (cpData) cpData.forEach((p: any) => phaseNameMap.set(p.id, p.name));

          // For any remaining, try phases table
          const missingIds = phaseIds.filter(id => !phaseNameMap.has(id));
          if (missingIds.length > 0) {
            const { data: pData } = await supabase
              .from('phases')
              .select('id, name')
              .in('id', missingIds);
            if (pData) pData.forEach((p: any) => phaseNameMap.set(p.id, p.name));
          }
        }

        if (documentsError) throw documentsError;

        // Map documents from phase_assigned_document_template table
        const mappedDocuments = (documentsData || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          document_type: doc.document_type || 'Standard',
          status: doc.status || 'Not Started',
          tech_applicability: doc.tech_applicability || 'All device types',
          description: doc.description,
          file_name: doc.file_name,
          file_size: doc.file_size,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          reviewer_group_ids: doc.reviewer_group_ids,
          // Compliance fields
          sub_section: doc.sub_section,
          section_ids: doc.section_ids,
          document_reference: doc.document_reference,
          version: doc.version,
          date: doc.date,
          start_date: doc.start_date,
          due_date: doc.due_date,
          phase_id: doc.phase_id || null,
          phase_name: doc.phase_id ? (phaseNameMap.get(doc.phase_id) || null) : null,
          is_current_effective_version: doc.is_current_effective_version,
          brief_summary: doc.brief_summary,
          author: doc.author,
          authors_ids: doc.authors_ids as string[] | null,
          need_template_update: doc.need_template_update,
          is_record: doc.is_record,
          reference_document_ids: doc.reference_document_ids as string[] | null,
          source_table: 'phase_assigned_document_template' as const,
          approval_date: doc.approval_date || null,
          approved_by: doc.approved_by || null,
          approval_note: doc.approval_note || null,
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          document_number: doc.document_number || null
        }));

        // Also query document_studio_templates for company-level documents (product_id IS NULL)
        const { data: studioData, error: studioError } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('company_id', companyId)
          .is('product_id', null)
          .order('created_at', { ascending: false });

        if (studioError) {
          console.warn('Error fetching document_studio_templates:', studioError);
        }

        // Keep all phase_assigned_document_template docs as primary.
        // Only include studio docs that are NOT a draft of an existing CI doc
        // (i.e. their template_id doesn't match any CI doc ID).
        const ciDocIds = new Set(mappedDocuments.map(d => d.id));
        const studioDocIds = new Set((studioData || []).map((d: any) => d.id));

        // Filter out studio docs whose template_id matches either:
        // 1. A CI doc ID (it's a draft of a CI doc), OR
        // 2. Another studio doc ID (it's a duplicate/chained draft)
        const studioDocuments: CompanyDocument[] = (studioData || [])
          .filter((doc: any) => !ciDocIds.has(doc.template_id) && !studioDocIds.has(doc.template_id))
          .map((doc: any) => {
            const meta = doc.metadata as any || {};
            return {
              id: doc.id,
              name: doc.name,
              document_type: doc.type || 'Standard',
              status: meta.status || 'Draft',
              tech_applicability: meta.tech_applicability || 'All device types',
              description: meta.description || `Created from Document Studio`,
              file_name: meta.file_name || undefined,
              file_size: meta.file_size || undefined,
              file_path: meta.file_path || undefined,
              uploaded_at: meta.uploaded_at || undefined,
              created_at: doc.created_at,
              updated_at: doc.updated_at,
              reviewer_group_ids: meta.reviewer_group_ids || null,
              sub_section: meta.sub_section || null,
              section_ids: meta.section_ids || null,
              document_reference: `DS-${doc.id}`,
              version: (doc.document_control as any)?.version || '1.0',
              date: meta.date || null,
              start_date: meta.start_date || null,
              due_date: meta.due_date || null,
              phase_id: meta.phase_id || null,
              is_current_effective_version: meta.is_current_effective_version || false,
              brief_summary: meta.brief_summary || null,
              author: meta.author || null,
              authors_ids: meta.authors_ids || null,
              need_template_update: meta.need_template_update || false,
              is_record: meta.is_record || false,
              reference_document_ids: meta.reference_document_ids || null,
              source_table: 'document_studio_templates' as const,
              approval_date: meta.approval_date || null,
              approved_by: meta.approved_by || null,
              approval_note: meta.approval_note || null,
              tags: Array.isArray(meta.tags) ? meta.tags : [],
              document_number: (doc.document_control as any)?.document_number || meta.document_number || null
            };
          });

        // One-time auto-correction: fix documents with hardcoded 'Report' type
        const allDocs = [...mappedDocuments, ...studioDocuments];
        const docsToFix = allDocs.filter(
          d => d.document_type === 'Report' && d.source_table === 'phase_assigned_document_template'
        );
        if (docsToFix.length > 0) {
          // Fire-and-forget update for affected records
          for (const doc of docsToFix) {
            const newType = doc.name?.toLowerCase().includes('manual') ? 'Manual' : 'Standard';
            supabase
              .from('phase_assigned_document_template')
              .update({ document_type: newType, updated_at: new Date().toISOString() } as any)
              .eq('id', doc.id)
              .then(({ error: updateErr }) => {
                if (updateErr) {
                  console.warn('Auto-correction of document_type failed for', doc.id, updateErr);
                } else {
                  console.log(`Auto-corrected document_type from "Report" to "${newType}" for`, doc.id);
                }
              });
            doc.document_type = newType;
          }
        }

        return allDocs;
      } catch (error) {
        throw error;
      }
    },
    enabled: isValidUUID(companyId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: 'always',
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ documentId, sourceTable }: { documentId: string; sourceTable?: 'documents' | 'phase_assigned_document_template' | 'document_studio_templates' }) => {
      const table = sourceTable === 'document_studio_templates' ? 'document_studio_templates' : 'phase_assigned_document_template';

      // Capture document name before deletion for audit trail
      const { data: docData } = await supabase
        .from(table)
        .select('name')
        .eq('id', documentId)
        .maybeSingle();

      const { data: deleted, error } = await supabase
        .from(table)
        .delete()
        .eq('id', documentId)
        .select('id');

      if (error) throw error;
      
      // If no rows deleted from primary table, try the other table
      if (!deleted || deleted.length === 0) {
        const altTable = table === 'phase_assigned_document_template' ? 'document_studio_templates' : 'phase_assigned_document_template';
        const { data: altDeleted, error: altError } = await supabase
          .from(altTable)
          .delete()
          .eq('id', documentId)
          .select('id');
        if (altError) throw altError;
        if (!altDeleted || altDeleted.length === 0) {
          throw new Error('Document not found in any table');
        }
      }

      // Cleanup: remove any linked drafts in document_studio_templates
      try {
        await supabase.from('document_studio_templates').delete().eq('template_id', documentId);
        await supabase.from('document_studio_templates').delete().eq('id', documentId);
      } catch (cleanupErr) {
        console.warn('Cleanup of linked studio drafts failed (non-blocking):', cleanupErr);
      }

      // Log document deletion to audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AuditTrailService.logDocumentRecordEvent({
          userId: user.id,
          companyId,
          action: 'document_deleted',
          entityType: 'document',
          entityId: documentId,
          entityName: docData?.name || 'Unknown document',
          actionDetails: { source_table: table },
        });
      }

      return documentId;
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
    },
    onError: () => {
      toast.error('Failed to delete document');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ documentId, status, approvalNote }: { documentId: string; status: string; approvalNote?: string }) => {
      // Get current user and current document state for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      const { data: docData } = await supabase
        .from('phase_assigned_document_template')
        .select('name, status')
        .eq('id', documentId)
        .maybeSingle();

      const oldStatus = docData?.status || 'Unknown';

      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set approval_date and approved_by when status is changed to "Approved"
      if (status.toLowerCase() === 'approved') {
        updateData.approval_date = new Date().toISOString();
        updateData.approved_by = user?.id || null;
        if (approvalNote) {
          updateData.approval_note = approvalNote;
        }
      }

      // Update in phase_assigned_document_template table only
      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update(updateData as any)
        .eq('id', documentId);

      if (error) throw error;

      // Log status change to audit trail
      if (user) {
        await AuditTrailService.logDocumentRecordEvent({
          userId: user.id,
          companyId,
          action: 'document_status_changed',
          entityType: 'document',
          entityId: documentId,
          entityName: docData?.name || 'Unknown document',
          changes: [{ field: 'status', oldValue: oldStatus, newValue: status }],
        });
      }

      return { documentId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
    },
    onError: () => {
      toast.error('Failed to update document status');
    },
  });

  const deleteDocument = (documentId: string, sourceTable?: 'documents' | 'phase_assigned_document_template' | 'document_studio_templates') => {
    deleteDocumentMutation.mutate({ documentId, sourceTable });
  };

  const updateDocumentStatus = (documentId: string, status: string, approvalNote?: string) => {
    updateStatusMutation.mutate({ documentId, status, approvalNote });
  };

  return {
    documents,
    isLoading,
    error,
    refetch,
    deleteDocument,
    updateDocumentStatus,
    isDeleting: deleteDocumentMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    updatingStatusId: updateStatusMutation.variables?.documentId
  };
}
