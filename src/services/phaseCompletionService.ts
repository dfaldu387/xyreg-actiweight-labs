import { supabase } from '@/integrations/supabase/client';

export interface PhaseCompletionItem {
  id: string;
  type: 'document' | 'activity' | 'audit' | 'gap_analysis';
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'overdue';
  due_date?: string;
  assigned_to?: string;
  description?: string;
  progress?: number;
}

export interface PhaseCompletionSummary {
  phase_name: string;
  total_items: number;
  completed_items: number;
  in_progress_items: number;
  overdue_items: number;
  completion_percentage: number;
  items: PhaseCompletionItem[];
}

export class PhaseCompletionService {
  /**
   * Get all completion items for a specific phase
   */
  static async getPhaseCompletionData(
    companyId: string,
    productId: string,
    phaseName: string
  ): Promise<PhaseCompletionSummary> {
    try {
      const items: PhaseCompletionItem[] = [];

      // Get documents for this phase
      const { data: documents } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          status,
          due_date,
          description,
          uploaded_by,
          phase_id
        `)
        .eq('company_id', companyId)
        .eq('product_id', productId);

      // Add documents to items
      documents?.forEach(doc => {
        items.push({
          id: doc.id,
          type: 'document',
          name: doc.name,
          status: this.mapDocumentStatus(doc.status),
          due_date: doc.due_date,
          assigned_to: doc.uploaded_by,
          description: doc.description
        });
      });

      // Get activities for this phase
      const { data: activities } = await supabase
        .from('activities')
        .select(`
          id,
          name,
          status,
          due_date,
          assignee_ids,
          type,
          phase_id,
          phases!inner(name)
        `)
        .eq('company_id', companyId)
        .eq('product_id', productId)
        .eq('phases.name', phaseName);

      // Add activities to items
      activities?.forEach(activity => {
        items.push({
          id: activity.id,
          type: 'activity',
          name: activity.name,
          status: this.mapActivityStatus(activity.status),
          due_date: activity.due_date,
          assigned_to: Array.isArray(activity.assignee_ids) ? String(activity.assignee_ids[0]) : undefined,
          description: `${activity.type} activity`
        });
      });

      // Get audits for this phase
      const { data: productAudits } = await supabase
        .from('product_audits')
        .select(`
          id,
          audit_name,
          status,
          deadline_date,
          responsible_person_id,
          notes,
          phase_id,
          phases!inner(name)
        `)
        .eq('product_id', productId)
        .eq('phases.name', phaseName);

      // Add audits to items
      productAudits?.forEach(audit => {
        items.push({
          id: audit.id,
          type: 'audit',
          name: audit.audit_name,
          status: this.mapAuditStatus(audit.status),
          due_date: audit.deadline_date,
          assigned_to: audit.responsible_person_id,
          description: audit.notes || 'Product audit'
        });
      });

      // Get gap analysis items for this phase
      const { data: gapAnalysis } = await supabase
        .from('gap_analysis_items')
        .select(`
          id,
          requirement,
          status,
          milestone_due_date,
          assigned_to,
          framework,
          clause_id
        `)
        .eq('product_id', productId);

      // Add gap analysis items
      gapAnalysis?.forEach(gap => {
        items.push({
          id: gap.id,
          type: 'gap_analysis',
          name: gap.requirement || `${gap.framework} - ${gap.clause_id}`,
          status: this.mapGapAnalysisStatus(gap.status),
          due_date: gap.milestone_due_date,
          assigned_to: gap.assigned_to,
          description: `${gap.framework} compliance requirement`
        });
      });

      // Calculate summary statistics
      const total_items = items.length;
      const completed_items = items.filter(item => item.status === 'completed').length;
      const in_progress_items = items.filter(item => item.status === 'in_progress').length;
      const overdue_items = items.filter(item => item.status === 'overdue').length;
      const completion_percentage = total_items > 0 ? Math.round((completed_items / total_items) * 100) : 0;

      // Sort items by priority (overdue first, then by due date)
      items.sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        return a.name.localeCompare(b.name);
      });

      return {
        phase_name: phaseName,
        total_items,
        completed_items,
        in_progress_items,
        overdue_items,
        completion_percentage,
        items
      };

    } catch (error) {
      console.error('Error fetching phase completion data:', error);
      return {
        phase_name: phaseName,
        total_items: 0,
        completed_items: 0,
        in_progress_items: 0,
        overdue_items: 0,
        completion_percentage: 0,
        items: []
      };
    }
  }

  private static mapDocumentStatus(status: string): 'completed' | 'in_progress' | 'not_started' | 'overdue' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'completed';
      case 'in progress':
      case 'review':
      case 'draft':
        return 'in_progress';
      case 'overdue':
        return 'overdue';
      default:
        return 'not_started';
    }
  }

  private static mapActivityStatus(status: string): 'completed' | 'in_progress' | 'not_started' | 'overdue' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'completed';
      case 'in_progress':
      case 'active':
        return 'in_progress';
      case 'overdue':
        return 'overdue';
      default:
        return 'not_started';
    }
  }

  private static mapAuditStatus(status: string): 'completed' | 'in_progress' | 'not_started' | 'overdue' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'closed':
        return 'completed';
      case 'in progress':
      case 'ongoing':
        return 'in_progress';
      case 'overdue':
        return 'overdue';
      default:
        return 'not_started';
    }
  }

  private static mapGapAnalysisStatus(status: string): 'completed' | 'in_progress' | 'not_started' | 'overdue' {
    switch (status?.toLowerCase()) {
      case 'compliant':
      case 'complete':
        return 'completed';
      case 'in_progress':
      case 'partial':
        return 'in_progress';
      case 'overdue':
        return 'overdue';
      default:
        return 'not_started';
    }
  }

  /**
   * Get completion data for multiple phases
   */
  static async getMultiPhaseCompletionData(
    companyId: string,
    productId: string,
    phaseNames: string[]
  ): Promise<PhaseCompletionSummary[]> {
    const results = await Promise.all(
      phaseNames.map(phaseName => 
        this.getPhaseCompletionData(companyId, productId, phaseName)
      )
    );
    return results;
  }
}