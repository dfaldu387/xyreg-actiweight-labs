import { useState, useEffect, useMemo } from 'react';
import { DefaultDocumentTemplateService } from '@/services/defaultDocumentTemplateService';
import { DefaultCompanyDocumentTemplate, DefaultDocumentTemplateFilters, DefaultDocumentTemplateStats } from '@/types/defaultDocumentTemplateTypes';
import { toast } from 'sonner';

export function useDefaultDocumentTemplates(filters?: DefaultDocumentTemplateFilters) {
  const [templates, setTemplates] = useState<DefaultCompanyDocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [phases, setPhases] = useState<string[]>([]);

  // Fetch all templates and metadata
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let templatesData: DefaultCompanyDocumentTemplate[];

      if (filters && (filters.searchTerm || filters.documentType !== 'all' || filters.phaseId !== 'all')) {
        templatesData = await DefaultDocumentTemplateService.getFilteredTemplates(filters);
      } else {
        templatesData = await DefaultDocumentTemplateService.getAllTemplates();
      }

      setTemplates(templatesData);

      // Fetch metadata only once (when no filters applied)
      if (!filters || (!filters.searchTerm && filters.documentType === 'all' && filters.phaseId === 'all')) {
        const [documentTypesData, phasesData] = await Promise.all([
          DefaultDocumentTemplateService.getUniqueDocumentTypes(),
          DefaultDocumentTemplateService.getUniquePhases()
        ]);

        setDocumentTypes(documentTypesData);
        setPhases(phasesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch default document templates';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching default document templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchTemplates();
  }, [filters?.searchTerm, filters?.documentType, filters?.phaseId]);

  // Calculate stats
  const stats: DefaultDocumentTemplateStats = useMemo(() => {
    return {
      totalTemplates: templates.length,
      templatesWithFiles: templates.filter(t => t.file_path || t.public_url).length,
      uniqueDocumentTypes: documentTypes.length,
      uniquePhases: phases.length
    };
  }, [templates, documentTypes, phases]);

  const refetch = () => {
    fetchTemplates();
  };

  const createTemplate = async (templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }): Promise<DefaultCompanyDocumentTemplate | null> => {
    try {
      const newTemplate = await DefaultDocumentTemplateService.createTemplate(templateData);
      if (newTemplate) {
        setTemplates(prev => [...prev, newTemplate]);
        await fetchTemplates();
      }
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  const editTemplate = async (id: string, templateData: {
    name: string;
    description?: string | null;
    document_type?: string | null;
    phase_id?: string[] | null;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    public_url?: string | null;
  }): Promise<DefaultCompanyDocumentTemplate | null> => {
    try {
      const updatedTemplate = await DefaultDocumentTemplateService.updateTemplate(id, templateData);
      if (updatedTemplate) {
        setTemplates(prev => prev.map(template => 
          template.id === id ? updatedTemplate : template
        ));
        await fetchTemplates();
      }
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const success = await DefaultDocumentTemplateService.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(template => template.id !== id));
        await fetchTemplates();
      }
      return success;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  };

  return {
    templates,
    isLoading,
    error,
    stats,
    documentTypes,
    phases,
    refetch,
    createTemplate,
    editTemplate,
    deleteTemplate
  };
}
