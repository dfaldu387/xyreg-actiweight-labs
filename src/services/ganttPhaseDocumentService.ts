import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GanttPhaseDocument {
  id: string;
  name: string;
  status: string;
  document_type?: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  file_name?: string;
  file_size?: number;
  file_path?: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
  phase_id: string;
  phase_name?: string;
}

export interface IndividualDocument {
  id: string;
  name: string;
  status: string;
  document_type?: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  phaseId: string;
  created_at: string;
  file_name?: string;
}

export interface PhaseDocumentSummary {
  phaseId: string;
  phaseName: string;
  documents: GanttPhaseDocument[];
  totalDocuments: number;
  completedDocuments: number;
  remainingDocuments: number;
  completionRate: number;
}

/**
 * Service to fetch phase-assigned documents for Gantt chart interactions
 */
export class GanttPhaseDocumentService {
  /**
   * Get all documents for a specific phase
   */
  static async getPhaseDocuments(
    phaseId: string, 
    companyId: string, 
    productId?: string
  ): Promise<GanttPhaseDocument[]> {
    try {
      if (!phaseId) {
        return [];
      }

      let phaseData: any[] = [];

      // Approach 1: Try to find templates using the provided phaseId directly from phase_assigned_document_template
      const { data: templateData, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select(`
          *,
          phases!inner(id, name, company_id)
        `)
        .eq('phase_id', phaseId)
        .eq('phases.company_id', companyId)
        .order('created_at', { ascending: true });

      if (!templateError && templateData && templateData.length > 0) {
        // Fetch reviewer group names for documents
        const documentsWithReviewers = await Promise.all(
          templateData.map(async (doc) => {
            let reviewer_names: string[] = [];

            // Check reviewer_group_ids array
            if (doc.reviewer_group_ids && Array.isArray(doc.reviewer_group_ids) && doc.reviewer_group_ids.length > 0) {
              try {
                const { data: reviewerGroups } = await supabase
                  .from('reviewer_groups')
                  .select('name')
                  .in('id', doc.reviewer_group_ids);

                if (reviewerGroups && reviewerGroups.length > 0) {
                  reviewer_names = reviewerGroups.map(g => g.name);
                }
              } catch (err) {
                console.warn('Failed to fetch reviewer groups for reviewer_group_ids:', doc.reviewer_group_ids);
              }
            }

            return {
              ...doc,
              phase_name: doc.phases?.name || 'Unknown Phase',
              reviewer_names: reviewer_names.length > 0 ? reviewer_names : undefined
            };
          })
        );

        phaseData = documentsWithReviewers;

      } else {
        // Fallback: Try to find documents in the documents table
        const { data: directData, error: directError } = await supabase
          .from('documents')
          .select(`
            *,
            phases!inner(id, name, company_id)
          `)
          .eq('phase_id', phaseId)
          .eq('company_id', companyId)
          .in('document_scope', ['company_template', 'product_document'])
          .order('created_at', { ascending: true });
        
        if (!directError && directData && directData.length > 0) {
          phaseData = directData.map(doc => ({
            ...doc,
            phase_name: (doc as any).phases?.name || 'Unknown Phase'
          }));
        }
      }

      // If we still don't have data and productId is provided, try product-specific documents
      if (phaseData.length === 0 && productId) {
        const { data: productData, error: productError } = await supabase
          .from('documents')
          .select(`
            *,
            phases!inner(id, name, company_id)
          `)
          .eq('phase_id', phaseId)
          .eq('company_id', companyId)
          .eq('product_id', productId)
          .eq('document_scope', 'product_document')
          .order('created_at', { ascending: true });

        if (!productError && productData && productData.length > 0) {
          phaseData = productData.map(doc => ({
            ...doc,
            phase_name: (doc as any).phases?.name || 'Unknown Phase'
          }));
        }
      }

      if (phaseData.length === 0) {
        // Additional debugging - check what phases exist
        const { data: allPhases } = await supabase
          .from('company_phases')
          .select('id, name')
          .eq('company_id', companyId);
          
        const { data: templatesInPhase } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, phase_id')
          .eq('phase_id', phaseId);
      }

      return phaseData || [];
    } catch (error) {
      console.error('Error fetching phase documents:', error);
      toast.error('Failed to load phase documents');
      throw error;
    }
  }

  /**
   * Get documents for multiple phases
   */
  static async getMultiplePhaseDocuments(
    phaseIds: string[], 
    companyId: string, 
    productId?: string
  ): Promise<PhaseDocumentSummary[]> {
    try {
      const results: PhaseDocumentSummary[] = [];

      for (const phaseId of phaseIds) {
        const documents = await this.getPhaseDocuments(phaseId, companyId, productId);
        
        // Get phase name
        const { data: phaseData } = await supabase
          .from('company_phases')
          .select('id, name')
          .eq('id', phaseId)
          .eq('company_id', companyId)
          .single();

        const phaseName = phaseData?.name || 'Unknown Phase';
        
        const completedDocuments = documents.filter(doc => {
          const status = doc.status?.toLowerCase();
          return status === 'completed' || 
                 status === 'approved' || 
                 status === 'complete' || 
                 status === 'finished';
        }).length;

        const remainingDocuments = documents.length - completedDocuments;
        const completionRate = documents.length > 0 ? (completedDocuments / documents.length) * 100 : 0;

        results.push({
          phaseId,
          phaseName,
          documents,
          totalDocuments: documents.length,
          completedDocuments,
          remainingDocuments,
          completionRate
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching multiple phase documents:', error);
      toast.error('Failed to load phase documents');
      throw error;
    }
  }

  /**
   * Get all documents for a company across all phases
   */
  static async getAllCompanyPhaseDocuments(companyId: string): Promise<Record<string, GanttPhaseDocument[]>> {
    try {
      // Get all phase documents from phase_assigned_document_template
      const { data: templateData, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select(`
          *,
          phases!inner(id, name, company_id)
        `)
        .eq('phases.company_id', companyId)
        .order('created_at', { ascending: true });

      if (templateError) {
        console.error('Error fetching template documents:', templateError);
        throw templateError;
      }

      // Group documents by phase
      const documentsByPhase: Record<string, GanttPhaseDocument[]> = {};

      if (templateData) {
        templateData.forEach(doc => {
          const phaseId = doc.phase_id;
          const phaseName = doc.phases?.name || 'Unknown Phase';
          
          if (!documentsByPhase[phaseId]) {
            documentsByPhase[phaseId] = [];
          }
          
          documentsByPhase[phaseId].push({
            ...doc,
            phase_name: phaseName
          });
        });
      }

      return documentsByPhase;
    } catch (error) {
      console.error('Error fetching all company phase documents:', error);
      toast.error('Failed to load company phase documents');
      throw error;
    }
  }

  /**
   * Get individual documents for a specific phase (optimized for Gantt chart)
   */
  static async getPhaseIndividualDocuments(
    phaseId: string, 
    companyId: string,
    productId: string
  ): Promise<IndividualDocument[]> {
    try {
      if (!phaseId || !companyId || !productId) {
        return [];
      }

      // console.log('[GanttPhaseDocumentService] Fetching individual documents for phase:', { phaseId, companyId, productId });

      // Fetch documents from phase_assigned_document_template with minimal fields for performance
      const { data: documents, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, document_type, description, due_date, start_date, created_at, file_name, phase_id')
        .eq('phase_id', phaseId)
        .eq('is_excluded', false)
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[GanttPhaseDocumentService] Error fetching individual documents:', error);
        return [];
      }

      if (!documents || documents.length === 0) {
        // console.log('[GanttPhaseDocumentService] No documents found for phase:', phaseId);
        return [];
      }

      // Transform to IndividualDocument format
      const individualDocs: IndividualDocument[] = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status || 'Not Started',
        document_type: doc.document_type,
        description: doc.description,
        due_date: doc.due_date,
        start_date: doc.start_date,
        phaseId: doc.phase_id,
        created_at: doc.created_at || new Date().toISOString(),
        file_name: doc.file_name
      }));

      // console.log(`[GanttPhaseDocumentService] Found ${individualDocs.length} individual documents for phase ${phaseId}`);
      return individualDocs;
    } catch (error) {
      console.error('[GanttPhaseDocumentService] Error fetching individual documents:', error);
      return [];
    }
  }

  /**
   * Get individual documents for multiple phases (batch operation)
   */
  static async getBatchPhaseIndividualDocuments(
    phaseIds: string[], 
    companyId: string,
    productId: string
  ): Promise<Record<string, IndividualDocument[]>> {
    try {
      if (!phaseIds || phaseIds.length === 0 || !companyId || !productId) {
        // console.log('[GanttPhaseDocumentService] Missing required parameters for batch fetch');
        return {};
      }

      // console.log(`[GanttPhaseDocumentService] Batch fetching documents for ${phaseIds.length} phases for product ${productId}`);

      // Single query to fetch all documents for all phases
      const { data: documents, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, document_type, description, due_date, start_date, created_at, file_name, phase_id')
        .in('phase_id', phaseIds)
        .eq('is_excluded', false)
        .eq('product_id', productId)
        .order('phase_id', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[GanttPhaseDocumentService] Error in batch fetch:', error);
        return {};
      }

      // Group documents by phase_id
      const documentsByPhase: Record<string, IndividualDocument[]> = {};
      
      // Initialize empty arrays for all requested phases
      phaseIds.forEach(phaseId => {
        documentsByPhase[phaseId] = [];
      });

      if (documents && documents.length > 0) {
        documents.forEach(doc => {
          const individualDoc: IndividualDocument = {
            id: doc.id,
            name: doc.name,
            status: doc.status || 'Not Started',
            document_type: doc.document_type,
            description: doc.description,
            due_date: doc.due_date,
            start_date: doc.start_date,
            phaseId: doc.phase_id,
            created_at: doc.created_at || new Date().toISOString(),
            file_name: doc.file_name
          };

          if (documentsByPhase[doc.phase_id]) {
            documentsByPhase[doc.phase_id].push(individualDoc);
          }
        });
      }

      const totalDocuments = Object.values(documentsByPhase).reduce((sum, docs) => sum + docs.length, 0);
      // console.log(`[GanttPhaseDocumentService] Batch fetch complete: ${totalDocuments} total documents across ${phaseIds.length} phases`);

      return documentsByPhase;
    } catch (error) {
      console.error('[GanttPhaseDocumentService] Error in batch fetch:', error);
      return {};
    }
  }

  /**
   * Get phase document summary for a specific phase
   */
  static async getPhaseDocumentSummary(
    phaseId: string, 
    companyId: string, 
    productId?: string
  ): Promise<PhaseDocumentSummary | null> {
    try {
      const documents = await this.getPhaseDocuments(phaseId, companyId, productId);
      
      if (documents.length === 0) {
        return null;
      }

      // Get phase name
      const { data: phaseData } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('id', phaseId)
        .eq('company_id', companyId)
        .single();

      const phaseName = phaseData?.name || 'Unknown Phase';
      
      const completedDocuments = documents.filter(doc => {
        const status = doc.status?.toLowerCase();
        return status === 'completed' || 
               status === 'approved' || 
               status === 'complete' || 
               status === 'finished';
      }).length;

      const remainingDocuments = documents.length - completedDocuments;
      const completionRate = documents.length > 0 ? (completedDocuments / documents.length) * 100 : 0;

      return {
        phaseId,
        phaseName,
        documents,
        totalDocuments: documents.length,
        completedDocuments,
        remainingDocuments,
        completionRate
      };
    } catch (error) {
      console.error('Error fetching phase document summary:', error);
      toast.error('Failed to load phase document summary');
      throw error;
    }
  }

  /**
   * Update individual document dates (start and/or due date)
   */
  /**
   * Normalize a date to YYYY-MM-DD format (preserves calendar date, removes timezone offset)
   * Example: Nov 16 2025 00:00:00 GMT+0530 → 2025-11-16
   */
  private static normalizeDateToDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async updateDocumentDates(
    documentId: string,
    dueDate?: Date,
    startDate?: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, fetch the current document to preserve reviewer_group_ids
      const { data: currentDoc, error: fetchError } = await supabase
        .from('phase_assigned_document_template')
        .select('reviewer_group_ids, reviewers')
        .eq('id', documentId)
        .single();

      // console.log('[updateDocumentDates] Current document:', {
      //   documentId,
      //   reviewer_group_ids: currentDoc?.reviewer_group_ids,
      //   reviewers: currentDoc?.reviewers,
      //   fetchError
      // });

      if (fetchError) {
        console.warn('[updateDocumentDates] Could not fetch current document:', fetchError);
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (dueDate) {
        updateData.due_date = this.normalizeDateToDateOnly(dueDate);
      }

      if (startDate) {
        updateData.start_date = this.normalizeDateToDateOnly(startDate);
      }

      // Always preserve reviewer_group_ids - use empty array if not set
      // This ensures the field is always included in the update payload
      if (currentDoc) {
        // Preserve exact value if it exists, otherwise use empty array
        updateData.reviewer_group_ids = currentDoc.reviewer_group_ids ?? [];
        updateData.reviewers = currentDoc.reviewers ?? [];
      } else {
        // If we couldn't fetch current doc, use empty arrays to avoid clearing data
        updateData.reviewer_group_ids = [];
        updateData.reviewers = [];
      }

      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        console.error('[updateDocumentDates] Update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[updateDocumentDates] Caught error:', error);
      return { success: false, error: 'Failed to update document dates' };
    }
  }

  /**
   * Validate document due date is within phase boundaries
   */
  static validateDocumentDueDate(
    dueDate: Date,
    phaseStartDate?: Date,
    phaseEndDate?: Date
  ): { isValid: boolean; error?: string } {
    if (phaseStartDate && dueDate < phaseStartDate) {
      // return {
      //   isValid: false,
      //   error: 'Document due date cannot be before phase start date'
      // };
    }

    if (phaseEndDate && dueDate > phaseEndDate) {
      // return {
      //   isValid: false,
      //   error: 'Document due date cannot be after phase end date'
      // };
    }

    return { isValid: true };
  }
}
