import { supabase } from '@/integrations/supabase/client';

export interface PhaseDocumentCount {
  phaseId: string;
  phaseName: string;
  totalDocuments: number;
  approvedDocuments: number;
  completionPercentage: number;
}

export class PhaseDocumentCountService {
  /**
   * Get approved document count for all phases of a product
   * Queries from phase_assigned_document_template table to match documents page
   */
  static async getPhaseDocumentCounts(
    productId: string,
    companyId: string
  ): Promise<PhaseDocumentCount[]> {
    try {
      // Get all phases for the product (lifecycle_phases)
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id')
        .eq('product_id', productId);

      if (phasesError) {
        console.error('[PhaseDocumentCountService] Error fetching phases:', phasesError);
        return [];
      }

      if (!phases || phases.length === 0) {
        return [];
      }

      // Get active (chosen) phase IDs for this company - same as documents page
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select('company_phases!inner(id)')
        .eq('company_id', companyId);

      if (chosenError) {
        console.error('[PhaseDocumentCountService] Error fetching chosen phases:', chosenError);
        return [];
      }

      const activePhaseIds = (chosenPhases || []).map((cp: any) => cp.company_phases?.id).filter(Boolean);

      // Get product-specific documents from phase_assigned_document_template
      // Same query as documents page uses
      const { data: productDocs, error: docsError } = activePhaseIds.length > 0
        ? await supabase
            .from('phase_assigned_document_template')
            .select('id, name, status, phase_id, company_phases!inner(company_id)')
            .eq('product_id', productId)
            .eq('company_phases.company_id', companyId)
            .in('phase_id', activePhaseIds)
        : { data: [], error: null };

      if (docsError) {
        console.error('[PhaseDocumentCountService] Error fetching product documents:', docsError);
      }

      // Get lifecycle phase IDs that correspond to the product's phases
      const lifecyclePhaseIds = phases.map(p => p.phase_id).filter(Boolean);

      // Get company template documents (product_id IS NULL) for phases matching this product
      const { data: templateDocs, error: templateError } = lifecyclePhaseIds.length > 0
        ? await supabase
            .from('phase_assigned_document_template')
            .select('id, name, status, phase_id, company_phases!inner(company_id)')
            .is('product_id', null)
            .eq('company_phases.company_id', companyId)
            .in('phase_id', lifecyclePhaseIds)
        : { data: [], error: null };

      if (templateError) {
        console.error('[PhaseDocumentCountService] Error fetching template documents:', templateError);
      }

      // Combine product-specific docs and template docs (avoiding duplicates by name)
      const allDocs = [...(productDocs || [])];
      const productDocNames = new Set((productDocs || []).map(d => d.name));

      (templateDocs || []).forEach(template => {
        if (!productDocNames.has(template.name)) {
          allDocs.push(template);
        }
      });

      const phaseCounts: PhaseDocumentCount[] = [];

      for (const phase of phases) {
        // Match documents by phase_id
        // phase.phase_id references company_phases.id, which is what phase_assigned_document_template.phase_id uses
        const phaseDocuments = allDocs.filter(doc => {
          if (!doc.phase_id) return false;
          return doc.phase_id === phase.phase_id;
        });

        const totalDocuments = phaseDocuments.length;
        // Count Approved, Rejected, and N/A as completed
        const approvedDocuments = phaseDocuments.filter(doc => {
          const status = doc.status;
          return status === 'Approved' ||
                 status === 'Rejected' ||
                 status === 'N/A';
        }).length;

        const completionPercentage = totalDocuments > 0
          ? Math.round((approvedDocuments / totalDocuments) * 100)
          : 0;

        phaseCounts.push({
          phaseId: phase.id,
          phaseName: phase.name,
          totalDocuments,
          approvedDocuments,
          completionPercentage
        });
      }

      return phaseCounts;
    } catch (error) {
      console.error('[PhaseDocumentCountService] Error getting phase document counts:', error);
      return [];
    }
  }

  /**
   * Get approved document count for a specific phase
   */
  static async getPhaseDocumentCount(
    phaseId: string,
    phaseName: string,
    productId?: string
  ): Promise<PhaseDocumentCount | null> {
    try {
      // Get documents for this phase from the documents table
      let query = supabase
        .from('documents')
        .select('id, name, status, document_scope')
        .eq('phase_id', phaseId)
        .in('document_scope', ['company_template', 'product_document']);

      // Add company filter if provided (instead of product filter)
      // This is more consistent with how documents are stored
      if (productId) {
        // Get company_id from product
        const { data: productData } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();

        if (productData?.company_id) {
          query = query.eq('company_id', productData.company_id);
        }
      }

      const { data: documents, error: docsError } = await query;

      if (docsError) {
        console.error(`Error fetching documents for phase ${phaseName}:`, docsError);
        return null;
      }

      const totalDocuments = documents?.length || 0;
      const approvedDocuments = documents?.filter(doc => {
        // Count documents as approved/completed based on exact status matching
        const status = doc.status;
        return status === 'Completed' || 
               status === 'Approved' || 
               status === 'Closed' ||
               status === 'Finished' ||
               status === 'Done';
      }).length || 0;

      const completionPercentage = totalDocuments > 0
        ? Math.round((approvedDocuments / totalDocuments) * 100)
        : 0;

      return {
        phaseId,
        phaseName,
        totalDocuments,
        approvedDocuments,
        completionPercentage
      };
    } catch (error) {
      console.error('Error getting phase document count:', error);
      return null;
    }
  }
} 