import { useMemo } from 'react';

export interface PriorityAction {
  id: string;
  title: string;
  subtitle: string;
  urgency: 'overdue' | 'urgent' | 'upcoming';
  daysOverdue?: number;
  daysUntilDue?: number;
  type: 'document' | 'activity' | 'audit' | 'approval';
}

interface PhaseCIData {
  documents: { overdue: number; pending: number };
  gapAnalysis: { overdue: number; pending: number };
  activities: any[];
  audits: any[];
}

export function usePriorityActions(phaseData: PhaseCIData): PriorityAction[] {
  return useMemo(() => {
    const actions: PriorityAction[] = [];

    // Add overdue documents
    if (phaseData.documents.overdue > 0) {
      actions.push({
        id: 'doc-overdue',
        title: 'Review Overdue Documents',
        subtitle: `${phaseData.documents.overdue} documents need attention`,
        urgency: 'overdue',
        daysOverdue: 5,
        type: 'document'
      });
    }

    // Add pending gap analysis
    if (phaseData.gapAnalysis.overdue > 0) {
      actions.push({
        id: 'gap-overdue',
        title: 'Complete Gap Analysis',
        subtitle: `${phaseData.gapAnalysis.overdue} items overdue`,
        urgency: 'overdue',
        daysOverdue: 3,
        type: 'approval'
      });
    }

    // Add pending activities
    const pendingActivities = phaseData.activities.filter(
      a => !['completed', 'Completed'].includes(a.status)
    );
    if (pendingActivities.length > 0) {
      actions.push({
        id: 'activity-pending',
        title: 'Complete Phase Activities',
        subtitle: `${pendingActivities.length} activities in progress`,
        urgency: 'urgent',
        daysUntilDue: 7,
        type: 'activity'
      });
    }

    // Add pending audits
    const pendingAudits = phaseData.audits.filter(
      a => !['completed', 'Completed'].includes(a.status)
    );
    if (pendingAudits.length > 0) {
      actions.push({
        id: 'audit-pending',
        title: 'Schedule Audit Reviews',
        subtitle: `${pendingAudits.length} audits pending`,
        urgency: 'upcoming',
        daysUntilDue: 14,
        type: 'audit'
      });
    }

    return actions.slice(0, 5); // Limit to top 5
  }, [phaseData]);
}
