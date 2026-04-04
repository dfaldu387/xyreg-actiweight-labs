import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateClinicalTrialData {
  study_name?: string;
  protocol_id?: string;
  study_type?: string;
  study_phase?: string;
  status?: string;
  priority?: string;
  target_enrollment?: number;
  actual_enrollment?: number;
  start_date?: string;
  estimated_completion_date?: string;
  ethics_approval_date?: string;
  primary_endpoint?: string;
  principal_investigator?: string;
  cro_partner_id?: string;
  description?: string;
  notes?: string;
}

export function useUpdateClinicalTrial() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTrial = async (trialId: string, data: UpdateClinicalTrialData) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('clinical_trials')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialId);

      if (error) throw error;

      toast.success('Clinical trial updated successfully');
    } catch (err) {
      console.error('Error updating clinical trial:', err);
      toast.error('Failed to update clinical trial');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateTrial,
    isUpdating,
  };
}
