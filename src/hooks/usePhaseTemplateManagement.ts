
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PhaseTemplate, PhaseTemplateAnalysis, PhaseTemplateService } from '@/services/phaseTemplateService';
import { toast } from 'sonner';

export function usePhaseTemplateManagement(companyId: string) {
  const [templates, setTemplates] = useState<PhaseTemplate[]>([]);
  const [analysis, setAnalysis] = useState<PhaseTemplateAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const fetchedTemplates = await PhaseTemplateService.getPhaseTemplates(companyId);
      setTemplates(fetchedTemplates);
      
      const fetchedAnalysis = await PhaseTemplateService.analyzePhaseTemplates(companyId);
      setAnalysis(fetchedAnalysis);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load phase templates');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const addTemplate = useCallback(async (templateData: {
    name: string;
    document_type: string;
    tech_applicability?: string;
    phase_id?: string;
  }) => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      await PhaseTemplateService.addPhaseTemplate(companyId, templateData);
      await loadTemplates();
      toast.success('Template added successfully');
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add phase template');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]); // Remove loadTemplates dependency to prevent circular dependency

  const updateTemplateAssignment = useCallback(async (templateId: string, newPhaseId: string | null) => {
    setIsLoading(true);
    try {
      await PhaseTemplateService.updateTemplatePhaseAssignment(templateId, newPhaseId);
      await loadTemplates();
      toast.success('Template assignment updated successfully');
    } catch (error) {
      console.error('Error updating template assignment:', error);
      toast.error('Failed to update template assignment');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove loadTemplates dependency to prevent circular dependency

  const deleteTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true);
    try {
      await PhaseTemplateService.deletePhaseTemplate(templateId);
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
      await loadTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete phase template');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove loadTemplates dependency to prevent circular dependency

  const cleanupTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const cleanupResult = await PhaseTemplateService.cleanupPhaseTemplates(companyId);
      toast.success(`Cleaned up templates: Removed ${cleanupResult.duplicatesRemoved} duplicates, Fixed ${cleanupResult.assignmentsFixed} assignments`);
      await loadTemplates();
    } catch (error) {
      console.error('Error cleaning up templates:', error);
      toast.error('Failed to cleanup phase templates');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]); // Remove loadTemplates dependency to prevent circular dependency

  useEffect(() => {
    if (companyId) {
      loadTemplates();
    }
  }, [companyId, loadTemplates]);

  const assignedTemplates = useMemo(() => {
    return templates.filter(t => t.documents && Array.isArray(t.documents) && t.documents.length > 0).length;
  }, [templates]);

  const unassignedTemplates = useMemo(() => {
    return templates.filter(t => !t.documents || !Array.isArray(t.documents) || t.documents.length === 0).length;
  }, [templates]);

  const duplicateGroupsCount = Array.isArray(analysis?.duplicateGroups) ? analysis.duplicateGroups.length : 0;
  
  const healthScore = useMemo(() => {
    if (!analysis || analysis.totalTemplates === 0) return 100;
    
    const assignmentScore = (analysis.assignedTemplates / analysis.totalTemplates) * 50;
    const issueScore = Math.max(0, 50 - (duplicateGroupsCount * 10) - ((analysis.orphanedTemplates || 0) * 5));
    
    return Math.round(assignmentScore + issueScore);
  }, [analysis, duplicateGroupsCount]);

  return {
    templates,
    analysis,
    isLoading,
    healthScore,
    assignedTemplates,
    unassignedTemplates,
    lastAnalyzed,
    loadTemplates,
    addTemplate,
    updateTemplateAssignment,
    deleteTemplate,
    cleanupTemplates
  };
}
