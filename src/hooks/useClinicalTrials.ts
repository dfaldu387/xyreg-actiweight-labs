import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClinicalTrial {
  id: string;
  company_id: string;
  product_id: string;
  phase_id?: string;
  study_name: string;
  protocol_id: string;
  study_type: 'feasibility' | 'pivotal' | 'pmcf' | 'registry' | 'other';
  study_phase: 'protocol' | 'ethics_review' | 'enrollment' | 'data_collection' | 'analysis' | 'reporting' | 'completed';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_enrollment: number;
  actual_enrollment: number;
  start_date?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  ethics_approval_date?: string;
  primary_endpoint?: string;
  secondary_endpoints?: string[];
  study_sites: Array<{
    name: string;
    location: string;
    pi_name?: string;
  }>;
  cro_name?: string;
  principal_investigator?: string;
  completion_percentage: number;
  assigned_to?: string;
  created_by: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useClinicalTrials(productId?: string, companyId?: string) {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrials = async () => {
    if (!productId && !companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('clinical_trials').select('*');

      if (productId) {
        query = query.eq('product_id', productId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform study_sites from Json to the expected array type
      const transformedData = (data || []).map(trial => ({
        ...trial,
        study_sites: Array.isArray(trial.study_sites) ? trial.study_sites : []
      })) as unknown as ClinicalTrial[];

      setTrials(transformedData);
    } catch (err) {
      console.error('Error fetching clinical trials:', err);
      setError('Failed to load clinical trials');
      toast.error('Failed to load clinical trials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, [productId, companyId]);

  return {
    trials,
    isLoading,
    error,
    refetch: fetchTrials
  };
}
