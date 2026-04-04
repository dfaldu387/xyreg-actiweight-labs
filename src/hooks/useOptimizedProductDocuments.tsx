
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { useUserDocumentAccess } from '@/hooks/useUserDocumentAccess';

// Helper function to get active (chosen) phase IDs for a company
async function getActivePhaseIds(companyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('company_chosen_phases')
    .select('company_phases!inner(id)')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching active phase IDs:', error);
    return [];
  }

  return (data || []).map((item: any) => item.company_phases.id);
}

export interface OptimizedDocument {
  id: string;
  name: string;
  status: string;
  phaseId: string;
  phaseName: string;
  documentType: string;
  dueDate?: string;
  due_date?: string; // Add this field for compatibility with DueDateBadge
  deadline?: string; // Add this field for compatibility with DueDateBadge
  isTemplate: boolean;
  templateSourceId?: string;
  productId?: string;
  companyId?: string;
  description?: string;
  reviewerGroupId?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  publicUrl?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  // New fields for document compliance
  sub_section?: string;
  document_reference?: string;
  version?: string;
  date?: string;
  is_current_effective_version?: boolean;
  brief_summary?: string;
  authors_ids?: string[]; // Multi-author support
  need_template_update?: boolean;
  phase_id?: string;
  reviewer_group_ids?: string[];
  reviewers?: any[];
  file_path?: string;
  file_name?: string;
  // Variant inheritance
  isInheritedFromMaster?: boolean;
  masterProductName?: string;
}

export function useOptimizedProductDocuments(productId: string, companyId: string) {
  // console.log('useOptimizedProductDocuments HOOK CALLED with:', { productId, companyId });
  const { filterDocumentsByAccess } = useUserDocumentAccess();
  const [documents, setDocuments] = useState<OptimizedDocument[]>([]);
  const [productSpecificDocument, setProductSpecificDocument] = useState<OptimizedDocument[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());

  const loadDocuments = useCallback(async () => {
    // console.log('=== useOptimizedProductDocuments START ===', { productId, companyId });

    if (!productId || !companyId) {
      // console.log('Missing required parameters:', { productId, companyId });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this product is a variant — if so, we'll also fetch the master's documents
      const { data: variantCheck } = await supabase
        .from('products')
        .select('parent_product_id, parent_relationship_type, name')
        .eq('id', productId)
        .maybeSingle();
      
      const isVariant = !!(variantCheck?.parent_product_id && variantCheck?.parent_relationship_type === 'variant');
      const masterProductId = isVariant ? variantCheck.parent_product_id : null;
      
      let masterProductName: string | null = null;
      if (masterProductId) {
        const { data: masterData } = await supabase
          .from('products')
          .select('name')
          .eq('id', masterProductId)
          .maybeSingle();
        masterProductName = masterData?.name || null;
      }

      // Load product lifecycle phases first
      // console.log('Querying lifecycle phases for product:', productId);

      const { data: lifecyclePhases, error: lifecycleError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id, category_id')
        .eq('product_id', productId)
        .order('name');

      if (lifecycleError) {
        console.error('Error loading lifecycle phases:', lifecycleError);
        throw lifecycleError;
      }

      // console.log('Product lifecycle phases:', lifecyclePhases);

      // If variant has no lifecycle phases, fetch master's phases and merge
      let mergedPhases = lifecyclePhases || [];
      
      if (isVariant && masterProductId && mergedPhases.length === 0) {
        const { data: masterLifecyclePhases } = await supabase
          .from('lifecycle_phases')
          .select('id, name, phase_id, category_id')
          .eq('product_id', masterProductId)
          .order('name');
        
        if (masterLifecyclePhases && masterLifecyclePhases.length > 0) {
          // Use master phases since variant has none
          mergedPhases = masterLifecyclePhases;
        }
      }

      // Use merged phases as the phases list
      setPhases(mergedPhases);

      // Build simple phase lookup map: for each lifecycle phase, map both its ID and its referenced company phase ID to the phase name
      const phaseMap = new Map();
      mergedPhases.forEach(lifecyclePhase => {
        // Map lifecycle phase ID to name
        phaseMap.set(lifecyclePhase.id, lifecyclePhase.name);
        // Map the company phase ID (stored in phase_id field) to the same name
        phaseMap.set(lifecyclePhase.phase_id, lifecyclePhase.name);
      });

      // Also fetch ALL company_phases for this company so docs referencing any phase resolve a name
      const { data: allCompanyPhases } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', companyId);
      
      (allCompanyPhases || []).forEach(cp => {
        if (!phaseMap.has(cp.id)) {
          phaseMap.set(cp.id, cp.name);
        }
      });

      // Get active (chosen) phase IDs for this company
      const activePhaseIds = await getActivePhaseIds(companyId);
      // console.log('Active phase IDs from company_chosen_phases:', activePhaseIds);

      // Load product-specific documents from documents table (where they're stored without phase_id)
      // Product-specific documents should NOT have a phase_id and should be in the documents table
      // console.log('Loading product-specific documents from documents table for product:', productId);
      const { data: productDocsFromDocuments, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)
        .eq('company_id', companyId)
        .eq('document_scope', 'product_document')
        .is('phase_id', null)
        .is('template_source_id', null); // Only get product-specific documents (not template instances)

      if (docsError) {
        console.error('Error loading product-specific documents from documents table:', docsError);
        throw docsError;
      }

      // Fetch product documents from phase_assigned_document_template
      const { data: rawPhaseTableDocs, error: phaseDocsError } = await supabase
            .from('phase_assigned_document_template')
            .select('*')
            .eq('product_id', productId)
            .eq('company_id', companyId)
            .eq('document_scope', 'product_document');

      if (phaseDocsError) {
        console.error('Error loading product-specific documents from phase_assigned_document_template:', phaseDocsError);
      }

      // Filter to only include docs from the product's active lifecycle phases (+ no phase)
      const lifecycleCompanyPhaseIds = new Set(
        (mergedPhases || []).map((lp: any) => lp.phase_id).filter(Boolean)
      );

      const productSpecificDocsFromPhaseTable = lifecycleCompanyPhaseIds.size > 0
        ? (rawPhaseTableDocs || []).filter((doc: any) =>
            !doc.phase_id || lifecycleCompanyPhaseIds.has(doc.phase_id)
          )
        : (rawPhaseTableDocs || []);

      // Template instances are now handled by the main query above
      // The phase_assigned_document_template table doesn't have template_source_id column
      const templateInstances: any[] = [];

      // Combine product-specific documents from both tables
      // These are the ones that should appear in "Core Documents" tab
      const productDocsFromDocsTable = (productDocsFromDocuments || []).map(doc => {
        // console.log('[useOptimizedProductDocuments] Mapping doc from documents table:', {
        //   id: doc.id,
        //   name: doc.name,
        //   document_scope: doc.document_scope,
        //   template_source_id: doc.template_source_id
        // });
        return {
          ...doc,
          isTemplate: false, // Mark as not a template
          isProductSpecific: true, // Mark as product-specific
          document_scope: doc.document_scope || 'product_document' // Ensure document_scope is set
        };
      });

      // Map product-specific documents from phase_assigned_document_template
      // Use the phaseMap to resolve phase names since we no longer JOIN company_phases
      const mappedProductDocsFromPhaseTable = (productSpecificDocsFromPhaseTable || []).map((doc: any) => {
        return {
          ...doc,
          isTemplate: false, // Mark as not a template
          isProductSpecific: true, // Mark as product-specific
          phase_name: phaseMap.get(doc.phase_id) || 'Unknown Phase',
          template_source_id: null // Ensure it's null for product-specific documents
        };
      });

      // Also fetch product documents from document_studio_templates
      const { data: studioProductDocs, error: studioDocsError } = await supabase
        .from('document_studio_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('product_id', productId);

      if (studioDocsError) {
        console.warn('Error loading product documents from document_studio_templates:', studioDocsError);
      }

      // Collect document_reference values from phase_assigned_document_template docs for dedup
      const ciDocRefs = new Set(
        (productSpecificDocsFromPhaseTable || [])
          .map((d: any) => d.document_reference)
          .filter(Boolean)
      );

      // Map studio docs, skipping any already present via DS-{id} reference
      const mappedStudioDocs = (studioProductDocs || [])
        .filter((doc: any) => !ciDocRefs.has(`DS-${doc.id}`))
        .map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          document_type: doc.type || 'Standard',
          status: 'Draft',
          description: doc.metadata?.description || 'Created from Document Studio',
          company_id: doc.company_id,
          product_id: doc.product_id,
          phase_id: null,
          document_scope: 'product_document',
          document_reference: `DS-${doc.id}`,
          version: (doc.document_control as any)?.version || '1.0',
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          isTemplate: false,
          isProductSpecific: true,
          template_source_id: null,
        } as any));

      // Combine all product-specific documents (avoid duplicates by ID)
      const allProductDocs = [...productDocsFromDocsTable];
      mappedProductDocsFromPhaseTable.forEach(doc => {
        if (!allProductDocs.some(existing => existing.id === doc.id)) {
          allProductDocs.push(doc);
        }
      });
      mappedStudioDocs.forEach(doc => {
        if (!allProductDocs.some(existing => existing.id === doc.id)) {
          allProductDocs.push(doc);
        }
      });

      const productDocs = allProductDocs;

      // Get lifecycle phases with end dates for this product
      const { data: productLifecyclePhases, error: lifecyclePhasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, end_date')
        .eq('product_id', productId);

      if (lifecyclePhasesError) {
        console.error('Error loading lifecycle phases end dates:', lifecyclePhasesError);
      }

      // Create a map of phase_id to phase end_date
      const phaseEndDateMap = new Map();
      (productLifecyclePhases || []).forEach(phase => {
        phaseEndDateMap.set(phase.id, phase.end_date);
      });

      // Set product-specific documents (from documents table, without phase_id)
      setProductSpecificDocument((productDocs as any) || []);
      
      // Only show real product documents - no virtual/inherited template injection
      let allDocs: any[] = [...(productDocs || [])];
      let productSpecificDocsWithCore: any[] = [...(productDocs || [])];

      // If this is a variant, also fetch master's documents and merge them
      if (isVariant && masterProductId) {
        const variantDocNames = new Set((productDocs || []).map((d: any) => d.name));
        
        // Fetch ALL master docs from phase_assigned_document_template (no scope filter — master docs may have various scopes)
        const { data: masterPhaseDocs } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .eq('product_id', masterProductId)
          .eq('company_id', companyId);
        
        // Fetch master docs from documents table
        const { data: masterDocsDocs } = await supabase
          .from('documents')
          .select('*')
          .eq('product_id', masterProductId)
          .eq('company_id', companyId)
          .is('template_source_id', null);

        const masterDocs = [
          ...(masterPhaseDocs || []),
          ...(masterDocsDocs || []).filter((d: any) => 
            !(masterPhaseDocs || []).some((pd: any) => pd.id === d.id)
          ),
        ];

        console.log('[Variant Inheritance] Master docs found:', masterDocs.length, 'Variant local docs:', productDocs?.length);

        // Add master docs that don't already exist on the variant (by name)
        const inheritedDocs = masterDocs
          .filter(doc => !variantDocNames.has(doc.name))
          .map(doc => ({
            ...doc,
            _isInheritedFromMaster: true,
            _masterProductName: masterProductName,
          }));
        
        console.log('[Variant Inheritance] Inherited docs after dedup:', inheritedDocs.length);
        
        allDocs = [...allDocs, ...inheritedDocs];
        productSpecificDocsWithCore = [...productSpecificDocsWithCore, ...inheritedDocs];
      }

      // Get the company phase IDs that correspond to the product's lifecycle phases
      const lifecyclePhaseIds = (mergedPhases || []).map(lp => lp.phase_id).filter(Boolean);

      // Filter lifecycle phase IDs to only include active phases
      const activeLifecyclePhaseIds = lifecyclePhaseIds.filter(id => activePhaseIds.includes(id));

      // No template/library document injection - only real product documents are shown

      // Remove duplicates based on document name and phase name (not phase_id,
      // since two phase tables can have different IDs for the same logical phase)
      const uniqueDocsMap = new Map();
      allDocs.forEach(doc => {
        const phaseName = doc.phase_name
          || mergedPhases?.find(lp => lp.phase_id === doc.phase_id)?.name
          || doc.phase_id;
        const key = `${doc.name}-${phaseName}`;
        // Prefer actual product documents over templates
        if (!uniqueDocsMap.has(key) || !doc.id.startsWith('template-')) {
          uniqueDocsMap.set(key, doc);
        }
      });
      
      const uniqueDocs = Array.from(uniqueDocsMap.values());

      // Transform documents
      const optimizedDocs: OptimizedDocument[] = uniqueDocs.map(doc => {
        const phaseName = phaseMap.get(doc.phase_id) || 'Unknown Phase';
        const phaseEndDate = phaseEndDateMap.get(doc.phase_id);
        const finalDueDate = doc.due_date || phaseEndDate;
        
        return {
          id: doc.id,
          name: doc.name,
          status: doc.status || 'Not Started',
          phaseId: doc.phase_id || '',
          phaseName,
          documentType: doc.document_type || 'Standard',
          dueDate: finalDueDate,
          due_date: finalDueDate, // For DueDateBadge compatibility
          deadline: finalDueDate, // For DueDateBadge compatibility
          isTemplate: doc.id.startsWith('template-') || doc.id.startsWith('company-core-'),
          templateSourceId: doc.id.startsWith('template-') ? doc.id.replace('template-', '') : undefined,
          productId: doc.product_id,
          companyId: doc.company_id,
          description: doc.description,
          reviewerGroupIds: doc.reviewer_group_ids,
          filePath: doc.file_path,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          publicUrl: (doc as any).public_url || null,
          uploadedAt: doc.uploaded_at,
          uploadedBy: doc.uploaded_by,
          // New fields for document compliance
          sub_section: (doc as any).sub_section,
          document_reference: (doc as any).document_reference,
          version: (doc as any).version,
          date: (doc as any).date,
          is_current_effective_version: (doc as any).is_current_effective_version,
          brief_summary: (doc as any).brief_summary,
          authors_ids: (doc as any).authors_ids,
          need_template_update: (doc as any).need_template_update,
          phase_id: doc.phase_id,
          reviewer_group_ids: doc.reviewer_group_ids as any,
          reviewers: doc.reviewers as any,
          file_path: doc.file_path,
          file_name: doc.file_name,
          isInheritedFromMaster: doc._isInheritedFromMaster || false,
          masterProductName: doc._masterProductName || undefined,
        };
      });

      setDocuments(optimizedDocs);

      // Transform productSpecificDocsWithCore to match OptimizedDocument interface
      const optimizedProductSpecificDocs: OptimizedDocument[] = productSpecificDocsWithCore.map((doc: any) => {
        const phaseName = phaseMap.get(doc.phase_id) || 'Unknown Phase';
        const phaseEndDate = phaseEndDateMap.get(doc.phase_id);
        const finalDueDate = doc.due_date || phaseEndDate;

        return {
          id: doc.id,
          name: doc.name,
          status: doc.status || 'Not Started',
          phaseId: doc.phase_id || '',
          phaseName,
          documentType: doc.document_type || 'Standard',
          dueDate: finalDueDate,
          due_date: finalDueDate,
          deadline: finalDueDate,
          isTemplate: doc.id.startsWith('template-'),
          templateSourceId: doc.id.startsWith('template-') ? doc.id.replace('template-', '') : undefined,
          productId: doc.product_id,
          companyId: doc.company_id,
          description: doc.description,
          reviewerGroupIds: doc.reviewer_group_ids,
          filePath: doc.file_path,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          publicUrl: (doc as any).public_url || null,
          uploadedAt: doc.uploaded_at,
          uploadedBy: doc.uploaded_by,
          // New fields for document compliance
          sub_section: (doc as any).sub_section,
          document_reference: (doc as any).document_reference,
          version: (doc as any).version,
          date: (doc as any).date,
          is_current_effective_version: (doc as any).is_current_effective_version,
          brief_summary: (doc as any).brief_summary,
          authors_ids: (doc as any).authors_ids,
          need_template_update: (doc as any).need_template_update,
          phase_id: doc.phase_id,
          reviewer_group_ids: doc.reviewer_group_ids,
          reviewers: Array.isArray(doc.reviewers) ? doc.reviewers : [],
          file_path: doc.file_path,
          file_name: doc.file_name,
          document_scope: doc.document_scope,
          template_source_id: doc.template_source_id,
          updated_at: doc.updated_at, // Include updated_at for date display
          created_at: doc.created_at, // Include created_at as fallback
          isInheritedFromMaster: doc._isInheritedFromMaster || false,
          masterProductName: doc._masterProductName || undefined,
        };
      });

      setProductSpecificDocument(optimizedProductSpecificDocs as any);

    } catch (err) {
      console.error('Error loading optimized documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [productId, companyId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const updateDocumentStatus = async (documentId: string, status: string, reviewerGroupId: string) => {
    try {
      if (documentId.startsWith("template-")) {
        const { error } = await supabase
          .from('phase_assigned_document_template')
          .update({ status, reviewer_group_id: reviewerGroupId })
          .eq('id', documentId);
      } else {
        const { error } = await supabase
          .from('documents')
          .update({ status, reviewer_group_id: reviewerGroupId })
          .eq('id', documentId);
      }

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setDocuments(prev => {
        const updated = prev.map(doc =>
          doc.id === documentId ? { ...doc, status } : doc
        );
        return [...updated]; // Create new array reference to ensure re-render
      });

      // Force timestamp update to invalidate any dependent memoized values
      setLastUpdateTimestamp(Date.now());

      // Invalidate React Query caches to ensure consistency across all components
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productDetails', productId] }),
        queryClient.invalidateQueries({ queryKey: ['documents', productId] }),
        queryClient.invalidateQueries({ queryKey: ['phase-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      ]);
      
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    }
  };

  // Function to update a specific document in local state without full refresh
  const updateDocumentInState = useCallback((updatedDocument: OptimizedDocument) => {
    setDocuments(prev => {
      const updated = prev.map(doc =>
        doc.id === updatedDocument.id ? { ...doc, ...updatedDocument } : doc
      );
      return [...updated]; // Create new array reference to ensure re-render
    });

    // Force timestamp update to invalidate any dependent memoized values
    setLastUpdateTimestamp(Date.now());
  }, []);

  const removeDocumentFromState = useCallback((documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setProductSpecificDocument(prev => prev.filter(doc => doc.id !== documentId));
    setLastUpdateTimestamp(Date.now());
  }, []);

  const addDocumentToState = useCallback((newDocument: OptimizedDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    setLastUpdateTimestamp(Date.now());
  }, []);

  const filteredDocuments = useMemo(
    () => filterDocumentsByAccess(documents),
    [documents, filterDocumentsByAccess]
  );

  const filteredProductSpecificDocument = useMemo(
    () => filterDocumentsByAccess(productSpecificDocument),
    [productSpecificDocument, filterDocumentsByAccess]
  );

  return {
    documents: filteredDocuments,
    phases,
    isLoading,
    error,
    updateDocumentStatus,
    updateDocumentInState,
    removeDocumentFromState,
    addDocumentToState,
    productSpecificDocument: filteredProductSpecificDocument,
    refreshDocuments: loadDocuments,
    lastUpdateTimestamp
  };
} 