import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StudyType = 'feasibility' | 'pivotal' | 'pmcf' | 'registry' | 'other';
export type TemplateType = 'CEP' | 'CER' | 'consent_form' | 'study_report' | 'ethics_submission';

export interface DocumentationTemplate {
  id: string;
  company_id: string;
  template_type: TemplateType;
  template_name: string;
  study_type: StudyType | null;
  region: string | null;
  file_path: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDocumentationTemplates(companyId: string) {
  const [templates, setTemplates] = useState<DocumentationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_documentation_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('template_type')
        .order('template_name');

      if (fetchError) throw fetchError;

      setTemplates((data as DocumentationTemplate[]) || []);
    } catch (err) {
      console.error('Error fetching documentation templates:', err);
      setError('Failed to load documentation templates');
      toast.error('Failed to load documentation templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: Omit<DocumentationTemplate, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clinical_documentation_templates')
        .insert({
          ...template,
          company_id: companyId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTemplates(prev => [...prev, data as DocumentationTemplate]);
      toast.success('Documentation template created');
      return data;
    } catch (err) {
      console.error('Error creating documentation template:', err);
      toast.error('Failed to create documentation template');
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<DocumentationTemplate>) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_documentation_templates')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Documentation template updated');
    } catch (err) {
      console.error('Error updating documentation template:', err);
      toast.error('Failed to update documentation template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinical_documentation_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Documentation template deleted');
    } catch (err) {
      console.error('Error deleting documentation template:', err);
      toast.error('Failed to delete documentation template');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateTemplate(id, { is_active: isActive });
  };

  const getTemplatesByType = (templateType: TemplateType) => {
    return templates.filter(t => t.template_type === templateType);
  };

  const getTemplatesByRegion = (region: string) => {
    return templates.filter(t => t.region === region);
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
    getTemplatesByType,
    getTemplatesByRegion,
    refetch: fetchTemplates
  };
}
