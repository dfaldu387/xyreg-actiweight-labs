import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhaseCIData {
  documents: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  gapAnalysis: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  activities: Array<{
    id: string;
    title: string;
    status: string;
    due_date?: string;
    date?: string;
  }>;
  audits: Array<{
    id: string;
    title: string;
    status: string;
    due_date?: string;
    date?: string;
  }>;
}

/**
 * Hook to fetch CI (Compliance Instance) data for a specific phase
 */
export function usePhaseCIData(phaseId: string, productId: string, companyId: string) {
  const [data, setData] = useState<PhaseCIData>({
    documents: { total: 0, completed: 0, pending: 0, overdue: 0 },
    gapAnalysis: { total: 0, completed: 0, pending: 0, overdue: 0 },
    activities: [],
    audits: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today && !['completed', 'compliant', 'Completed', 'Approved'].includes(status);
  };

  /**
   * Fetch the set of document IDs that are excluded for this product
   * via document_ci_exclusion_scopes in field_scope_overrides.
   */
  const fetchExcludedDocIds = async (): Promise<Set<string>> => {
    try {
      // Check if this product is a variant
      const { data: productData } = await supabase
        .from('products')
        .select('parent_product_id, parent_relationship_type, field_scope_overrides')
        .eq('id', productId)
        .maybeSingle();

      const isVariant = !!productData?.parent_product_id && productData?.parent_relationship_type === 'variant';
      if (!isVariant) return new Set();

      const overrides = (productData?.field_scope_overrides as Record<string, any>) || {};
      const exclusionScopes = overrides.document_ci_exclusion_scopes;
      if (!exclusionScopes || typeof exclusionScopes !== 'object') return new Set();

      const excludedIds = new Set<string>();
      for (const [docId, scope] of Object.entries(exclusionScopes)) {
        const s = scope as any;
        if (s?.excludedProductIds?.includes(productId)) {
          excludedIds.add(docId);
        }
      }
      return excludedIds;
    } catch {
      return new Set();
    }
  };

  const fetchDocuments = async (excludedDocIds: Set<string>): Promise<PhaseCIData['documents']> => {
    try {
      const { data: phaseDocsData, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, status, due_date')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .eq('phase_id', phaseId);

      if (error) throw error;

      // Filter out excluded documents
      const documents = (phaseDocsData || []).filter(doc => !excludedDocIds.has(doc.id));
      const total = documents.length;
      const completed = documents.filter(doc => 
        ['Completed', 'Approved'].includes(doc.status || '')
      ).length;
      const overdue = documents.filter(doc => 
        calculateOverdue(doc.due_date, doc.status || '')
      ).length;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching phase documents:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  const fetchGapAnalysis = async (): Promise<PhaseCIData['gapAnalysis']> => {
    try {
      const { data: gapItems, error } = await supabase
        .from('gap_analysis_items')
        .select('id, status, milestone_due_date')
        .eq('product_id', productId);

      if (error) throw error;

      const items = gapItems || [];
      const total = items.length;
      const completed = items.filter(item => 
        ['compliant', 'completed'].includes(item.status || '')
      ).length;
      const overdue = items.filter(item => 
        calculateOverdue(item.milestone_due_date, item.status || '')
      ).length;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching gap analysis items:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  const fetchActivities = async (): Promise<PhaseCIData['activities']> => {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, name, status, start_date, end_date, due_date, updated_at')
        .eq('product_id', productId)
        .eq('phase_id', phaseId);

      if (error) throw error;

      return (activities || []).map(activity => ({
        id: activity.id,
        title: activity.name || 'Untitled Activity',
        name: activity.name || 'Untitled Activity',
        status: activity.status || 'pending',
        due_date: activity.due_date,
        date: activity.due_date
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };

  const fetchAudits = async (): Promise<PhaseCIData['audits']> => {
    try {
      // Fetch audits that are specifically assigned to this phase
      const { data: audits, error } = await supabase
        .from('audits')
        .select('id, name, status, date')
        .eq('product_id', productId)
        .eq('phase_id', phaseId);

      if (error) throw error;

      return (audits || []).map(audit => ({
        id: audit.id,
        title: audit.name || 'Audit',
        name: audit.name || 'Audit',
        status: audit.status || 'pending',
        due_date: audit.date,
        date: audit.date
      }));
    } catch (error) {
      console.error('Error fetching audits:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!phaseId || !productId || !companyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const excludedDocIds = await fetchExcludedDocIds();
        const [documents, gapAnalysis, activities, audits] = await Promise.all([
          fetchDocuments(excludedDocIds),
          fetchGapAnalysis(),
          fetchActivities(),
          fetchAudits()
        ]);

        setData({
          documents,
          gapAnalysis,
          activities,
          audits
        });
      } catch (error) {
        console.error('Error fetching phase CI data:', error);
        setError('Failed to load CI data for this phase');
        toast.error('Failed to load CI data for this phase');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [phaseId, productId, companyId]);

  // Add refetch function for manual data refresh
  const refetch = () => {
    if (phaseId && productId && companyId) {
      setIsLoading(true);
      setError(null);
      
      fetchExcludedDocIds().then(excludedDocIds => {
        return Promise.all([
          fetchDocuments(excludedDocIds),
          fetchGapAnalysis(),
          fetchActivities(),
          fetchAudits()
        ]);
      }).then(([documents, gapAnalysis, activities, audits]) => {
        setData({
          documents,
          gapAnalysis,
          activities,
          audits
        });
      }).catch(error => {
        console.error('Error refetching phase CI data:', error);
        setError('Failed to reload CI data');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  };

  return { data, isLoading, error, refetch };
}
