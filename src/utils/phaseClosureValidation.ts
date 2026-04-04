import { supabase } from '@/integrations/supabase/client';

export interface PhaseClosureValidationResult {
  canClose: boolean;
  incompleteItems: {
    documents: Array<{ id: string; name: string; status: string }>;
    activities: Array<{ id: string; name: string; status: string }>;
    audits: Array<{ id: string; name: string; status: string }>;
  };
  message: string;
}

export async function validatePhaseCompletionRequirements(
  phaseId: string,
  productId: string
): Promise<PhaseClosureValidationResult> {
  try {
    // Get phase information
    const { data: phase, error: phaseError } = await supabase
      .from('lifecycle_phases')
      .select(`
        name, 
        phase_id
      `)
      .eq('id', phaseId)
      .single();

    if (phaseError || !phase) {
      console.error('Phase query error:', phaseError);
      return {
        canClose: false,
        incompleteItems: { documents: [], activities: [], audits: [] },
        message: 'Phase not found'
      };
    }

    // Check documents linked to this phase
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, name, status')
      .eq('phase_id', phase.phase_id)
      .eq('product_id', productId);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    // Check activities linked to this phase
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, status')
      .eq('phase_id', phase.phase_id)
      .eq('product_id', productId);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Check audits linked to this phase
    const { data: audits, error: auditsError } = await supabase
      .from('audits')
      .select('id, name, status')
      .eq('phase_id', phase.phase_id)
      .eq('product_id', productId);

    if (auditsError) {
      console.error('Error fetching audits:', auditsError);
    }

    // Filter incomplete items
    const incompleteDocuments = (documents || []).filter(doc => 
      doc.status !== 'Completed' && doc.status !== 'completed'
    );
    
    const incompleteActivities = (activities || []).filter(activity => 
      activity.status !== 'completed' && activity.status !== 'Completed'
    );
    
    const incompleteAudits = (audits || []).filter(audit => 
      audit.status !== 'Completed' && audit.status !== 'completed'
    );

    const totalIncomplete = incompleteDocuments.length + incompleteActivities.length + incompleteAudits.length;
    const canClose = totalIncomplete === 0;

    // Generate message
    let message = '';
    if (canClose) {
      message = 'All compliance instances are completed. Phase can be closed.';
    } else {
      const incompleteParts = [];
      if (incompleteDocuments.length > 0) {
        incompleteParts.push(`${incompleteDocuments.length} document(s)`);
      }
      if (incompleteActivities.length > 0) {
        incompleteParts.push(`${incompleteActivities.length} activity(ies)`);
      }
      if (incompleteAudits.length > 0) {
        incompleteParts.push(`${incompleteAudits.length} audit(s)`);
      }
      message = `Cannot close phase: ${incompleteParts.join(', ')} must be completed first.`;
    }

    return {
      canClose,
      incompleteItems: {
        documents: incompleteDocuments,
        activities: incompleteActivities,
        audits: incompleteAudits
      },
      message
    };
  } catch (error) {
    console.error('Error validating phase completion:', error);
    return {
      canClose: false,
      incompleteItems: { documents: [], activities: [], audits: [] },
      message: 'Error validating phase completion requirements'
    };
  }
}