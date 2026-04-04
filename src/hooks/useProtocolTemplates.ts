import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StudyType = 'feasibility' | 'pivotal' | 'pmcf' | 'registry' | 'other';

export interface ProtocolTemplate {
  id: string;
  company_id: string;
  template_name: string;
  study_type: StudyType | null;
  file_path: string;
  required_sections: string[];
  approval_workflow: Record<string, any>;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProtocolTemplates(companyId: string) {
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_protocol_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('template_name');

      if (fetchError) throw fetchError;

      setTemplates((data as ProtocolTemplate[]) || []);
    } catch (err) {
      console.error('Error fetching protocol templates:', err);
      setError('Failed to load protocol templates');
      toast.error('Failed to load protocol templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: Omit<ProtocolTemplate, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_protocol_templates')
        .insert({
          ...template,
          company_id: companyId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTemplates(prev => [...prev, data as ProtocolTemplate]);
      toast.success('Protocol template created');
      return data;
    } catch (err) {
      console.error('Error creating protocol template:', err);
      toast.error('Failed to create protocol template');
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<ProtocolTemplate>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_protocol_templates')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Protocol template updated');
    } catch (err) {
      console.error('Error updating protocol template:', err);
      toast.error('Failed to update protocol template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_protocol_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Protocol template deleted');
    } catch (err) {
      console.error('Error deleting protocol template:', err);
      toast.error('Failed to delete protocol template');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateTemplate(id, { is_active: isActive });
  };

  const getTemplatesByStudyType = (studyType: StudyType | null) => {
    return templates.filter(t => t.study_type === studyType);
  };

  useEffect(() => {
    fetchTemplates();
  }, [companyId]);

  const activeTemplates = templates.filter(t => t.is_active);

  return {
    templates,
    activeTemplates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleActive,
    getTemplatesByStudyType,
    refetch: fetchTemplates
  };
}
