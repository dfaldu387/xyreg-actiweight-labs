import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CIAnalyticsData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

interface UseCIAnalyticsResult {
  documents: CIAnalyticsData;
  gapAnalysisItems: CIAnalyticsData;
  activities: CIAnalyticsData;
  audits: CIAnalyticsData;
  isLoading: boolean;
  error: string | null;
}

export function useCIAnalytics(productId: string, companyId: string): UseCIAnalyticsResult {
  const [data, setData] = useState<UseCIAnalyticsResult>({
    documents: { total: 0, completed: 0, pending: 0, overdue: 0 },
    gapAnalysisItems: { total: 0, completed: 0, pending: 0, overdue: 0 },
    activities: { total: 0, completed: 0, pending: 0, overdue: 0 },
    audits: { total: 0, completed: 0, pending: 0, overdue: 0 },
    isLoading: true,
    error: null
  });

  const calculateOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDate < today && !['completed', 'compliant', 'Completed', 'Approved'].includes(status);
    console.log(`[calculateOverdue] dueDate: ${dueDate}, today: ${today}, status: ${status}, isOverdue: ${isOverdue}`);
    return isOverdue;
  };

  const fetchDocuments = async (): Promise<CIAnalyticsData> => {
    try {
      // Query phase assigned document templates - same as usePhaseDocuments
      const { data: phaseDocsData, error } = await supabase
        .from('phase_assigned_document_template')
        .select(`
          id,
          status,
          due_date,
          phase_id,
          phases!inner(
            id,
            company_id
          )
        `)
        .eq('phases.company_id', companyId);

      if (error) throw error;

      // Also get lifecycle phase end dates for the product
      const { data: lifecyclePhases } = await supabase
        .from('lifecycle_phases')
        .select('phase_id, end_date')
        .eq('product_id', productId);

      const phaseEndDateMap = new Map();
      (lifecyclePhases || []).forEach(phase => {
        phaseEndDateMap.set(phase.phase_id, phase.end_date);
      });

      const documents = (phaseDocsData || []).map(doc => ({
        ...doc,
        // Use lifecycle phase end date if no specific due date is set
        effective_due_date: doc.due_date || phaseEndDateMap.get(doc.phase_id)
      }));

      const total = documents.length;
      const completed = documents.filter(doc => 
        ['Completed', 'Approved'].includes(doc.status || '')
      ).length;
      const overdue = documents.filter(doc => 
        calculateOverdue(doc.effective_due_date, doc.status || '')
      ).length;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  const fetchGapAnalysisItems = async (): Promise<CIAnalyticsData> => {
    try {
      const { data: gapItems, error } = await supabase
        .from('gap_analysis_items')
        .select('id, status, milestone_due_date')
        .eq('product_id', productId);

      if (error) throw error;

      const total = gapItems?.length || 0;
      const completed = gapItems?.filter(item => 
        ['compliant', 'completed'].includes(item.status || '')
      ).length || 0;
      const overdue = gapItems?.filter(item => 
        calculateOverdue(item.milestone_due_date, item.status || '')
      ).length || 0;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching gap analysis items:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  const fetchActivities = async (): Promise<CIAnalyticsData> => {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, status, due_date')
        .eq('product_id', productId);

      if (error) throw error;

      const total = activities?.length || 0;
      const completed = activities?.filter(activity => 
        ['completed', 'Completed'].includes(activity.status || '')
      ).length || 0;
      const overdue = activities?.filter(activity => 
        calculateOverdue(activity.due_date, activity.status || '')
      ).length || 0;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  const fetchAudits = async (): Promise<CIAnalyticsData> => {
    try {
      // Fetch both company and product audits
      const [companyAuditsResult, productAuditsResult] = await Promise.all([
        supabase
          .from('company_audits')
          .select('id, status, deadline_date')
          .eq('company_id', companyId),
        supabase
          .from('audits')
          .select('id, status, date')
          .eq('product_id', productId)
      ]);

      const companyAudits = companyAuditsResult.data || [];
      const productAudits = productAuditsResult.data || [];

      const allAudits = [
        ...companyAudits.map(audit => ({ ...audit, due_date: audit.deadline_date })),
        ...productAudits.map(audit => ({ ...audit, due_date: audit.date }))
      ];

      const total = allAudits.length;
      const completed = allAudits.filter(audit => 
        ['completed', 'Completed'].includes(audit.status || '')
      ).length;
      const overdue = allAudits.filter(audit => 
        calculateOverdue(audit.due_date, audit.status || '')
      ).length;
      const pending = total - completed - overdue;

      return { total, completed, pending, overdue };
    } catch (error) {
      console.error('Error fetching audits:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!productId || !companyId) return;

      setData(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const [documents, gapAnalysisItems, activities, audits] = await Promise.all([
          fetchDocuments(),
          fetchGapAnalysisItems(),
          fetchActivities(),
          fetchAudits()
        ]);

        setData({
          documents,
          gapAnalysisItems,
          activities,
          audits,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching CI analytics:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load compliance instance analytics'
        }));
        toast.error('Failed to load compliance instance analytics');
      }
    };

    fetchAllData();
  }, [productId, companyId]);

  return data;
}