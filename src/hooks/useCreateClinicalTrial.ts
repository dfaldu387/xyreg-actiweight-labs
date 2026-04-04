import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface CreateClinicalTrialData {
  product_id: string;
  company_id: string;
  study_name: string;
  protocol_id: string;
  study_type: string;
  study_phase: string;
  status: string;
  priority: string;
  target_enrollment: number;
  actual_enrollment: number;
  start_date?: string;
  estimated_completion_date?: string;
  ethics_approval_date?: string;
  primary_endpoint?: string;
  principal_investigator?: string;
  cro_partner_id?: string;
  description?: string;
  notes?: string;
}

export function useCreateClinicalTrial() {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createTrial = async (data: CreateClinicalTrialData) => {
    setIsCreating(true);
    try {
      // Use cached user from AuthContext
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('clinical_trials')
        .insert({
          ...data,
          created_by: user.id,
          completion_percentage: 0,
          study_sites: [],
        });

      if (error) throw error;

      toast.success('Clinical trial created successfully');
    } catch (err) {
      console.error('Error creating clinical trial:', err);
      toast.error('Failed to create clinical trial');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTrial,
    isCreating,
  };
}
