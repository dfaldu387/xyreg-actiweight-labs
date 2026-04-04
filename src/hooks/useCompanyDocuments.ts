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
  due_date?: string | null;
  phase_id?: string | null;
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
        const { data: documentsData, error: documentsError } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .eq('company_id', companyId)
          .eq('document_scope', 'company_document')
          .order('name');

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
          due_date: doc.due_date,
          phase_id: doc.phase_id || null,
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
          tags: Array.isArray(doc.tags) ? doc.tags : []
        }));

        // Also query document_studio_templates for company-level documents (product_id IS NULL)
        const { data: studioData, error: studioError } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('company_id', companyId)
          .is('product_id', null)
          .order('name');

        if (studioError) {
          console.warn('Error fetching document_studio_templates:', studioError);
        }

        // Collect document_reference values from CI docs to deduplicate
        const ciDocRefs = new Set(
          mappedDocuments
            .map(d => d.document_reference)
            .filter(Boolean)
        );

        // Map studio documents and merge, skipping any already present via DS-{id} reference
        const studioDocuments: CompanyDocument[] = (studioData || [])
          .filter((doc: any) => !ciDocRefs.has(`DS-${doc.id}`))
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
              tags: Array.isArray(meta.tags) ? meta.tags : []
            };
          });

        return [...mappedDocuments, ...studioDocuments];
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

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', documentId);

      if (error) throw error;

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
        .update(updateData)
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
