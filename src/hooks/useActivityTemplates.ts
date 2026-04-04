
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityTemplate } from '@/types/activities';
import { toast } from 'sonner';

export function useActivityTemplates(companyId: string | null) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setTemplates((data || []) as ActivityTemplate[]);
    } catch (error) {
      console.error('Error fetching activity templates:', error);
      toast.error('Failed to load activity templates');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const createTemplate = async (template: Omit<ActivityTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let templateData = { ...template };
      
      // Handle file upload if present
      if ((templateData as any).document_file) {
        const file = (templateData as any).document_file as File;
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `activity-templates/${companyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error('Failed to upload document file');
        }

        // Add file information to template data
        (templateData as any).file_path = filePath;
        (templateData as any).file_name = file.name;
        
        // Remove the file object from template data
        delete (templateData as any).document_file;
      }
      
      // Remove document_path if it exists (it's not a database field)
      delete (templateData as any).document_path;

      const { data, error } = await supabase
        .from('activity_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [...prev, data as ActivityTemplate]);
      toast.success('Activity template created successfully');
      return data as ActivityTemplate;
    } catch (error) {
      console.error('Error creating activity template:', error);
      toast.error('Failed to create activity template');
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<ActivityTemplate>) => {
    try {
      console.log('🔄 Starting updateTemplate with data:', updates);
      let updateData = { ...updates };
      
      // Handle file upload if present
      if ((updateData as any).document_file) {
        const file = (updateData as any).document_file as File;
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `activity-templates/${companyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error('Failed to upload document file');
        }

        // Add file information to update data
        (updateData as any).file_path = filePath;
        (updateData as any).file_name = file.name;
        
        // Remove the file object from update data
        delete (updateData as any).document_file;
      }
      
      // Remove document_path if it exists (it's not a database field)
      delete (updateData as any).document_path;

      const { data, error } = await supabase
        .from('activity_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => prev.map(t => t.id === id ? data as ActivityTemplate : t));
      toast.success('Activity template updated successfully');
      return data as ActivityTemplate;
    } catch (error) {
      console.error('Error updating activity template:', error);
      toast.error('Failed to update activity template');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activity_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Activity template deleted successfully');
    } catch (error) {
      console.error('Error deleting activity template:', error);
      toast.error('Failed to delete activity template');
      throw error;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
}
