import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StudyType = 'feasibility' | 'pivotal' | 'pmcf' | 'registry' | 'other';

export interface StudyTypeConfig {
  id: string;
  company_id: string;
  study_type: StudyType;
  is_enabled: boolean;
  default_min_enrollment: number | null;
  default_max_enrollment: number | null;
  typical_timeline_months: number | null;
  required_documents: string[];
  phase_progression_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const defaultConfigs: Omit<StudyTypeConfig, 'id' | 'company_id' | 'created_at' | 'updated_at'>[] = [
  {
    study_type: 'feasibility',
    is_enabled: true,
    default_min_enrollment: 10,
    default_max_enrollment: 50,
    typical_timeline_months: 12,
    required_documents: ['Protocol', 'Informed Consent Form', 'Ethics Approval'],
    phase_progression_rules: { mandatory_phases: ['protocol', 'ethics_review', 'enrollment'] }
  },
  {
    study_type: 'pivotal',
    is_enabled: true,
    default_min_enrollment: 100,
    default_max_enrollment: 500,
    typical_timeline_months: 24,
    required_documents: ['Protocol', 'Informed Consent Form', 'Statistical Analysis Plan', 'Ethics Approval'],
    phase_progression_rules: { mandatory_phases: ['protocol', 'ethics_review', 'enrollment', 'data_collection', 'analysis', 'reporting'] }
  },
  {
    study_type: 'pmcf',
    is_enabled: true,
    default_min_enrollment: 50,
    default_max_enrollment: 200,
    typical_timeline_months: 36,
    required_documents: ['PMCF Plan', 'Informed Consent Form', 'Data Collection Forms', 'Ethics Approval'],
    phase_progression_rules: { mandatory_phases: ['protocol', 'enrollment', 'data_collection', 'reporting'] }
  },
  {
    study_type: 'registry',
    is_enabled: true,
    default_min_enrollment: 200,
    default_max_enrollment: 1000,
    typical_timeline_months: 60,
    required_documents: ['Registry Protocol', 'Data Collection Forms', 'Ethics Approval'],
    phase_progression_rules: { mandatory_phases: ['protocol', 'enrollment', 'data_collection'] }
  },
  {
    study_type: 'other',
    is_enabled: true,
    default_min_enrollment: 20,
    default_max_enrollment: 100,
    typical_timeline_months: 18,
    required_documents: ['Protocol', 'Ethics Approval'],
    phase_progression_rules: { mandatory_phases: ['protocol', 'ethics_review'] }
  }
];

export function useStudyTypeConfigs(companyId: string) {
  const [configs, setConfigs] = useState<StudyTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_study_type_configs')
        .select('*')
        .eq('company_id', companyId)
        .order('study_type');

      if (fetchError) throw fetchError;

      // If no configs exist, seed defaults
      if (!data || data.length === 0) {
        await seedDefaults(companyId);
        await fetchConfigs();
        return;
      }

      setConfigs(data as StudyTypeConfig[]);
    } catch (err) {
      console.error('Error fetching study type configs:', err);
      setError('Failed to load study type configurations');
      toast.error('Failed to load study type configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const seedDefaults = async (companyId: string) => {
    try {
      const configsToInsert = defaultConfigs.map(config => ({
        ...config,
        company_id: companyId
      }));

      const { error: insertError } = await supabase
        .from('clinical_study_type_configs')
        .insert(configsToInsert);

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error seeding default configs:', err);
    }
  };

  const updateConfig = async (id: string, updates: Partial<StudyTypeConfig>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_study_type_configs')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Configuration updated');
    } catch (err) {
      console.error('Error updating config:', err);
      toast.error('Failed to update configuration');
    }
  };

  const toggleEnabled = async (id: string, isEnabled: boolean) => {
    await updateConfig(id, { is_enabled: isEnabled });
  };

  const getConfigForType = (studyType: StudyType) => {
    return configs.find(c => c.study_type === studyType);
  };

  useEffect(() => {
    fetchConfigs();
  }, [companyId]);

  const enabledCount = configs.filter(c => c.is_enabled).length;

  return {
    configs,
    isLoading,
    error,
    updateConfig,
    toggleEnabled,
    getConfigForType,
    enabledCount,
    refetch: fetchConfigs
  };
}
