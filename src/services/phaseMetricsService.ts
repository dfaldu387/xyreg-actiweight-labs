import { supabase } from "@/integrations/supabase/client";

export interface PhaseMetricsData {
  documents: { total: number; completed: number; percentage: number | null };
  gapAnalysis: { total: number; completed: number; percentage: number | null };
  activities: { total: number; completed: number; percentage: number | null };
  audits: { total: number; completed: number; percentage: number | null };
  clinical_trials: { total: number; completed: number; percentage: number | null };
  overall: { completed: number; total: number; percentage: number | null };
}

export class PhaseMetricsService {
  /**
   * Get Gap Analysis metrics for a phase - only approved items count as completed
   * Note: phaseId here is lifecycle_phases.id, but we need company_phases.id for gap analysis
   */
  static async getGapAnalysisMetrics(productId: string, phaseId: string): Promise<{ total: number; completed: number; percentage: number | null }> {
    try {
      // First, get the company_phases.id from lifecycle_phases
      const { data: phaseData, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        console.error('Error fetching phase data:', phaseError);
        return { total: 0, completed: 0, percentage: null };
      }

      const companyPhaseId = phaseData?.phase_id;
      if (!companyPhaseId) {
        return { total: 0, completed: 0, percentage: null };
      }

      // Get all gap analysis items for this product
      const { data: allItems, error: allError } = await supabase
        .from('gap_analysis_items')
        .select('id, admin_approved, applicable_phases')
        .eq('product_id', productId);

      if (allError) {
        console.error('Error fetching gap analysis items:', allError);
        return { total: 0, completed: 0, percentage: null };
      }
      // Filter items that apply to this phase
      const phaseItems = allItems?.filter(item => {
        // If applicable_phases is empty or null, it applies to all phases
        if (!item.applicable_phases || !Array.isArray(item.applicable_phases) || item.applicable_phases.length === 0) {
          return true;
        }
        // Check if this phase is in the applicable_phases array
        return item.applicable_phases.includes(companyPhaseId);
      }) || [];
      // Count total and approved items
      const total = phaseItems.length;
      const completed = phaseItems.filter(item => item.admin_approved === true).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : null;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Error getting gap analysis metrics:', error);
      return { total: 0, completed: 0, percentage: null };
    }
  }

  /**
   * Get Activities metrics for a phase - only approved items count as completed
   * Note: For activities, phaseId should be the lifecycle_phases.id, not company_phases.id
   */
  static async getActivitiesMetrics(productId: string, phaseId: string): Promise<{ total: number; completed: number; percentage: number | null }> {
    try {
      // Activities are stored with lifecycle_phases.id as phase_id
      const { data: allItems, error: allError } = await supabase
        .from('activities')
        .select('id, admin_approved, phase_id')
        .eq('product_id', productId)
        .eq('phase_id', phaseId);
      if (allError) {
        console.error('Error fetching activities:', allError);
        return { total: 0, completed: 0, percentage: null };
      }

      // Count total and approved items
      const total = allItems?.length || 0;
      const completed = allItems?.filter(item => item.admin_approved === true).length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : null;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Error getting activities metrics:', error);
      return { total: 0, completed: 0, percentage: null };
    }
  }

  /**
   * Get Audits metrics for a phase - only completed audits count as completed
   * Note: phaseId here is lifecycle_phases.id, but we need company_phases.id for audits
   */
  static async getAuditsMetrics(productId: string, phaseId: string): Promise<{ total: number; completed: number; percentage: number | null }> {
    try {
      // First, get the company_phases.id from lifecycle_phases
      const { data: phaseData, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('id', phaseId)
        // .single();

      if (phaseError) {
        console.error('Error fetching phase data:', phaseError);
        return { total: 0, completed: 0, percentage: null };
      }

      const companyPhaseId = phaseData?.phase_id;
      if (!companyPhaseId) {
        return { total: 0, completed: 0, percentage: null };
      }

      // Get the phase name from company_phases
      const { data: companyPhaseData, error: companyPhaseError } = await supabase
        .from('company_phases')
        .select('name')
        .eq('id', companyPhaseId)
        .single();

      if (companyPhaseError) {
        console.error('Error fetching company phase name:', companyPhaseError);
        return { total: 0, completed: 0, percentage: null };
      }

      const phaseName = companyPhaseData?.name;

      // Get product audits for this product and phase
      const { data: productAudits, error: productError } = await supabase
        .from('product_audits')
        .select('id, status, lifecycle_phase')
        .eq('product_id', productId)
        .eq('lifecycle_phase', phaseName);

      if (productError) {
        console.error('Error fetching product audits:', productError);
        return { total: 0, completed: 0, percentage: null };
      }

      // Count total and completed audits (status = 'Completed')
      const total = productAudits?.length || 0;
      const completed = productAudits?.filter(audit => audit.status === 'Completed').length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : null;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Error getting audit logs metrics:', error);
      return { total: 0, completed: 0, percentage: null };
    }
  }

  /**
   * Get Documents metrics for a phase
   * Note: phaseId here is lifecycle_phases.id, but we need company_phases.id for documents
   */
  static async getDocumentsMetrics(productId: string, phaseId: string): Promise<{ total: number; completed: number; percentage: number | null }> {
    try {
      // First, get the company_phases.id from lifecycle_phases
      const { data: phaseData, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        console.error('Error fetching phase data for documents:', phaseError);
        return { total: 0, completed: 0, percentage: null };
      }

      const companyPhaseId = phaseData?.phase_id;
      if (!companyPhaseId) {
        return { total: 0, completed: 0, percentage: null };
      }

      // Get all documents for this product and company phase
      const { data: allDocs, error: docsError } = await supabase
        .from('documents')
        .select('id, name, status, phase_id')
        .eq('product_id', productId)
        .eq('phase_id', companyPhaseId);

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        return { total: 0, completed: 0, percentage: null };
      }

      // Count total and completed documents (status = 'Approved' or 'Signed')
      const total = allDocs?.length || 0;
      const completed = allDocs?.filter(doc =>
        doc.status === 'Approved' || doc.status === 'Signed' || doc.status === 'Released'
      ).length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : null;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Error getting documents metrics:', error);
      return { total: 0, completed: 0, percentage: null };
    }
  }

  /**
   * Get Clinical Trials metrics for a phase - only completed trials count as completed
   * Note: phaseId here is lifecycle_phases.id, but we need company_phases.id for clinical trials
   */
  static async getClinicalTrialsMetrics(productId: string, phaseId: string): Promise<{ total: number; completed: number; percentage: number | null }> {
    try {
      // First, get the company_phases.id from lifecycle_phases
      const { data: phaseData, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        console.error('Error fetching phase data for clinical trials:', phaseError);
        return { total: 0, completed: 0, percentage: null };
      }

      const companyPhaseId = phaseData?.phase_id;
      if (!companyPhaseId) {
        return { total: 0, completed: 0, percentage: null };
      }

      // Get all clinical trials for this product and company phase
      const { data: allTrials, error: trialsError } = await supabase
        .from('clinical_trials')
        .select('id, status, phase_id')
        .eq('product_id', productId)
        .eq('phase_id', companyPhaseId);

      if (trialsError) {
        console.error('Error fetching clinical trials:', trialsError);
        return { total: 0, completed: 0, percentage: null };
      }

      // Count total and completed trials (status = 'Completed')
      const total = allTrials?.length || 0;
      const completed = allTrials?.filter(trial => trial.status === 'Completed').length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : null;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Error getting clinical trials metrics:', error);
      return { total: 0, completed: 0, percentage: null };
    }
  }

  /**
   * Get all metrics for a phase
   */
  static async getPhaseMetrics(productId: string, phaseId: string): Promise<PhaseMetricsData> {
    try {
      // Fetch all metrics in parallel
      const [documents, gapAnalysis, activities, audits, clinical_trials] = await Promise.all([
        this.getDocumentsMetrics(productId, phaseId),
        this.getGapAnalysisMetrics(productId, phaseId),
        this.getActivitiesMetrics(productId, phaseId),
        this.getAuditsMetrics(productId, phaseId),
        this.getClinicalTrialsMetrics(productId, phaseId)
      ]);

      // Calculate overall metrics - only count categories that have items
      const categoriesWithItems = [documents, gapAnalysis, activities, audits, clinical_trials].filter(cat => cat.total > 0);
      const totalItems = categoriesWithItems.reduce((sum, cat) => sum + cat.total, 0);
      const completedItems = categoriesWithItems.reduce((sum, cat) => sum + cat.completed, 0);
      const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : null;

      const metrics = {
        documents,
        gapAnalysis,
        activities,
        audits,
        clinical_trials,
        overall: {
          total: totalItems,
          completed: completedItems,
          percentage: overallPercentage
        }
      };

      return metrics;

    } catch (error) {
      console.error('Error getting phase metrics:', error);
      return {
        documents: { total: 0, completed: 0, percentage: null },
        gapAnalysis: { total: 0, completed: 0, percentage: null },
        activities: { total: 0, completed: 0, percentage: null },
        audits: { total: 0, completed: 0, percentage: null },
        clinical_trials: { total: 0, completed: 0, percentage: null },
        overall: { total: 0, completed: 0, percentage: null }
      };
    }
  }

  /**
   * Get metrics for multiple phases
   */
  static async getMultiplePhaseMetrics(productId: string, phaseIds: string[]): Promise<Record<string, PhaseMetricsData>> {
    try {
      const results = await Promise.all(
        phaseIds.map(async (phaseId) => {
          const metrics = await this.getPhaseMetrics(productId, phaseId);
          return {
            phaseId,
            metrics
          };
        })
      );

      const metricsRecord: Record<string, PhaseMetricsData> = {};
      results.forEach(({ phaseId, metrics }) => {
        metricsRecord[phaseId] = metrics;
      });

      return metricsRecord;
    } catch (error) {
      console.error('Error getting multiple phase metrics:', error);
      return {};
    }
  }
}