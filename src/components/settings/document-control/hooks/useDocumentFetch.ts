import { useState, useEffect, useCallback } from "react";
import { DocumentItem } from "@/types/client";
import { fetchPhases, Phase } from "../services/phaseService";
import { fetchCompanyDocumentTemplates } from "@/services/documentTemplateService";
import { fixedPhaseOrder } from "../constants/phaseOrder";

/**
 * Convert DocumentServiceDocument to DocumentItem with enhanced fields for table display
 */
const convertToDocumentItems = (docs: any[]): DocumentItem[] => {
  return docs.map(doc => {
    console.log('[convertToDocumentItems] Processing document:', {
      name: doc.name,
      file_path: doc.file_path,
      file_name: doc.file_name,
      file_size: doc.file_size,
      rawDoc: doc
    });
    
    return {
      id: doc.id || crypto.randomUUID(),
      name: doc.name,
      type: doc.type || doc.document_type || 'Standard',
      description: doc.description || '',
      phases: doc.phases || [], // Allow empty phases array for unassigned documents
      techApplicability: doc.tech_applicability || doc.techApplicability || 'All device types',
      markets: doc.markets || [],
      deviceClasses: doc.classes_by_market || doc.deviceClasses || {},
      version: '1.0',
      lastUpdated: doc.updated_at || new Date().toISOString(),
      reviewers: doc.reviewers || [],
      created_at: doc.updated_at || new Date().toISOString(),
      // File information fields - ensure these are properly mapped
      file_path: doc.file_path,
      file_name: doc.file_name,
      file_size: doc.file_size,
      file_type: doc.file_type,
      public_url: doc.public_url,
      // Enhanced fields for table display - now properly typed
      phaseName: doc.phase_name || 'Unassigned',
      phaseDescription: doc.phase_description || '',
      categoryName: doc.category_name || 'Uncategorized',
      documentSource: doc.document_scope === 'saas_template' ? 'SaaS' :
                     doc.document_scope === 'company_template' ? 'Company Template' : 
                     doc.is_predefined_core_template ? 'Predefined Core' : 'Company Template',
      position: doc.position || 0,
      // Pass through additional fields for filtering
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      sub_section: doc.sub_section || null,
      status: doc.status || 'Not Started',
      authors_ids: Array.isArray(doc.authors_ids) ? doc.authors_ids : [],
    };
  });
};

/**
 * Hook for fetching and managing document data with enhanced fields
 */
export function useDocumentFetch(companyId?: string, templatesOnly: boolean = false) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseOrder, setPhaseOrder] = useState<Phase[]>([]);

  /**
   * Load phases data for the specific company
   */
  const loadPhases = useCallback(async () => {
    try {
      console.log("[useDocumentFetch] Loading phases for company:", companyId);
      const { availablePhases: phases, phaseOrder: order } = await fetchPhases(companyId);
      setAvailablePhases(phases);
      setPhaseOrder(order);
      console.log("[useDocumentFetch] Phases loaded successfully:", phases.length);
    } catch (error) {
      console.error("[useDocumentFetch] Error loading phases:", error);
    }
  }, [companyId]);

  /**
   * Load ALL documents/templates with enhanced metadata for table display
   */
  const loadDocuments = useCallback(async () => {
    if (!companyId) {
      console.log("[useDocumentFetch] No company ID provided, skipping document load");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`[useDocumentFetch] Loading enhanced company document templates for:`, companyId);
      
      // Use the improved template service that fetches ALL company templates with enhanced metadata
      const docs = await fetchCompanyDocumentTemplates(companyId);
      
      console.log("[useDocumentFetch] Raw documents from service:", docs.length);
      console.log("[useDocumentFetch] Sample documents:", docs.slice(0, 3).map(d => ({ 
        name: d.name, 
        type: d.document_type, 
        phases: d.phases,
        phaseName: (d as any).phase_name,
        categoryName: (d as any).category_name
      })));
      
      // Convert to DocumentItems with enhanced fields
      const convertedDocs = convertToDocumentItems(docs);
      
      console.log(`[useDocumentFetch] Successfully loaded ${convertedDocs.length} enhanced templates`);
      console.log("[useDocumentFetch] Enhanced phase distribution:", {
        assigned: convertedDocs.filter(d => d.phases && d.phases.length > 0).length,
        unassigned: convertedDocs.filter(d => !d.phases || d.phases.length === 0).length,
        withPhaseNames: convertedDocs.filter(d => (d as any).phaseName !== 'Unassigned').length
      });
      
      setDocuments(convertedDocs);
    } catch (error) {
      console.error("[useDocumentFetch] Error loading documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, templatesOnly]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("[useDocumentFetch] Starting enhanced data load...");
      await Promise.all([
        loadPhases(),
        loadDocuments()
      ]);
      console.log("[useDocumentFetch] Enhanced data load completed");
    };
    
    loadInitialData();
  }, [loadPhases, loadDocuments]);

  /**
   * Enhanced public method to refresh documents data
   */
  const fetchAllDocumentsPublic = useCallback(async (): Promise<void> => {
    console.log("[useDocumentFetch] Public enhanced refresh triggered");
    try {
      await Promise.all([
        loadPhases(),
        loadDocuments()
      ]);
      console.log("[useDocumentFetch] Public enhanced refresh completed successfully");
    } catch (error) {
      console.error("[useDocumentFetch] Error during public enhanced refresh:", error);
      throw error;
    }
  }, [loadPhases, loadDocuments]);

  // Helper functions for backward compatibility
  const availablePhaseNames = availablePhases.map(phase => phase.name);
  const phaseOrderNames = phaseOrder.map(phase => phase.name);

  return {
    documents,
    setDocuments,
    availablePhases,
    availablePhaseNames,
    loading,
    phaseOrder,
    phaseOrderNames,
    fetchAllDocuments: fetchAllDocumentsPublic
  };
}

// Re-export the fixed phase order for other components to use
export { fixedPhaseOrder } from "../constants/phaseOrder";
