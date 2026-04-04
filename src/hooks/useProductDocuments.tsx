import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserDocumentAccess } from '@/hooks/useUserDocumentAccess';

interface ProductDocument {
  id: string;
  name: string;
  status: string;
  phaseId: string;
  phaseName: string;
  documentType: string;
  dueDate?: string;
  progress: number;
  document_type?: string;
  tech_applicability?: string;
  created_at?: string;
  updated_at?: string;
  file_path?: string;
  file_name?: string;
  phase_id?: string;
  product_id?: string;
}

export interface ProductDocumentGroup {
  noPhase: ProductDocument[];
  withPhases: Array<{
    phase_id: string;
    phase_name: string;
    documents: ProductDocument[];
  }>;
}

export function useProductDocuments(productId?: string) {
  const { filterDocumentsByAccess } = useUserDocumentAccess();
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [organizedDocuments, setOrganizedDocuments] = useState<ProductDocumentGroup>({
    noPhase: [],
    withPhases: []
  });
  const [phases, setPhases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const loadData = async () => {
    if (!productId) {
      setDocuments([]);
      setOrganizedDocuments({ noPhase: [], withPhases: [] });
      setPhases([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First get the product details to find company_id
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, company_id, current_lifecycle_phase')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      // Get company phases - using explicit typing to avoid deep type instantiation
      let phases: Array<{id: string, name: string, description: string}> = [];
      try {
        // First get phase IDs
        const { data: phaseIds } = await (supabase as any)
          .from('phase_assigned_document_template')
          .select('phase_id')
          .eq('company_id', product.company_id)
          .not('phase_id', 'is', null);
        
        if (phaseIds && phaseIds.length > 0) {
          // Then get phase details separately
          const uniquePhaseIds = [...new Set(phaseIds.map((item: any) => item.phase_id))];
          const { data: phasesInfo } = await (supabase as any)
            .from('phases')
            .select('id, name, description')
            .in('id', uniquePhaseIds);
          phases = phasesInfo || [];
        }
      } catch (err) {
        console.error('Phase loading error:', err);
        // Continue without phases if this fails
      }

      // Extract unique phases from the simplified query
      const uniquePhases = new Map();
      phases.forEach((phase: any) => {
        if (phase && !uniquePhases.has(phase.id)) {
          uniquePhases.set(phase.id, {
            id: phase.id,
            name: phase.name,
            description: phase.description
          });
        }
      });
      
      setPhases(Array.from(uniquePhases.values()));

      // Get product documents (both with and without phases)
      const { data: productDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document');

      if (docsError) throw docsError;

      // Check if we have any product documents, if not auto-instantiate
      if (!productDocs || productDocs.length === 0) {
        console.log('No product documents found, auto-instantiating...');

        // Get company template documents
        const { data: templates, error: templatesError } = await (supabase as any)
          .from('phase_assigned_document_template')
          .select('*')
          .eq('company_id', product.company_id);

        if (!templatesError && templates) {
          // Create product instances of templates
          const productInstances = templates.map(template => ({
            product_id: productId,
            company_id: product.company_id,
            name: template.name,
            status: 'Not Started',
            document_type: template.document_type,
            tech_applicability: template.tech_applicability,
            phase_id: template.phase_id,
            template_id: template.id,
            document_scope: 'product_document' as const
          }));

          const { error: insertError } = await supabase
            .from('documents')
            .insert(productInstances);

          if (insertError) {
            console.error('Error creating product document instances:', insertError);
          } else {
            // Reload documents after creation
            await loadData();
            return;
          }
        }
      } else {
        // Process existing documents
        const processedDocs = productDocs.map(doc => {
          const phaseInfo = Array.from(uniquePhases.values()).find((p: any) => p.id === doc.phase_id);
          
          return {
            id: doc.id,
            name: doc.name,
            status: doc.status || 'Not Started',
            phaseId: doc.phase_id || '',
            phaseName: phaseInfo?.name || 'No Phase',
            documentType: doc.document_type || 'Standard',
            dueDate: doc.due_date,
            progress: getProgressFromStatus(doc.status || 'Not Started'),
            document_type: doc.document_type,
            tech_applicability: doc.tech_applicability,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            file_path: doc.file_path,
            file_name: doc.file_name,
            phase_id: doc.phase_id,
            product_id: doc.product_id
          };
        });
        
        setDocuments(processedDocs);

        // Organize documents into noPhase and withPhases
        const noPhaseDocuments = processedDocs.filter(doc => !doc.phase_id);
        const phaseDocuments = processedDocs.filter(doc => doc.phase_id);

        // Group phase documents by phase
        const phaseGroups = new Map();
        phaseDocuments.forEach(doc => {
          if (!phaseGroups.has(doc.phase_id)) {
            phaseGroups.set(doc.phase_id, {
              phase_id: doc.phase_id,
              phase_name: doc.phaseName,
              documents: []
            });
          }
          phaseGroups.get(doc.phase_id).documents.push(doc);
        });

        setOrganizedDocuments({
          noPhase: noPhaseDocuments,
          withPhases: Array.from(phaseGroups.values())
        });
      }

    } catch (err) {
      console.error('Error loading product documents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const getProgressFromStatus = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      case 'under_review': return 75;
      case 'not_started': 
      case 'not started': return 0;
      default: return 0;
    }
  };

  const updateDocumentStatus = async (documentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status, progress: getProgressFromStatus(status) }
          : doc
      ));

      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      return false;
    }
  };

  const getDocumentsByPhase = (phaseId: string) => {
    return documents.filter(doc => doc.phaseId === phaseId);
  };

  const getPhaseProgress = (phaseId: string) => {
    const phaseDocs = getDocumentsByPhase(phaseId);
    if (phaseDocs.length === 0) return 0;
    
    const totalProgress = phaseDocs.reduce((sum, doc) => sum + doc.progress, 0);
    return Math.round(totalProgress / phaseDocs.length);
  };

  const handleStatusFilterChange = (newFilter: string[]) => {
    setStatusFilter(newFilter);
  };

  const handleDocumentUpdate = (documentId: string, updatedDoc: any) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, ...updatedDoc } : doc
    ));
  };

  const refreshDocuments = loadData;

  const filteredDocuments = useMemo(
    () => filterDocumentsByAccess(documents),
    [documents, filterDocumentsByAccess]
  );

  const filteredOrganizedDocuments = useMemo(() => ({
    noPhase: filterDocumentsByAccess(organizedDocuments.noPhase),
    withPhases: organizedDocuments.withPhases.map(group => ({
      ...group,
      documents: filterDocumentsByAccess(group.documents),
    })).filter(group => group.documents.length > 0),
  }), [organizedDocuments, filterDocumentsByAccess]);

  return {
    documents: filteredDocuments,
    organizedDocuments: filteredOrganizedDocuments,
    phases,
    isLoading,
    error,
    statusFilter,
    updateDocumentStatus,
    getDocumentsByPhase,
    getPhaseProgress,
    handleStatusFilterChange,
    handleDocumentUpdate,
    refreshDocuments
  };
}