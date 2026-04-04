import { useState, useEffect } from "react";
import { CompanyGapTemplateService, CompanyGapTemplate, GapTemplateWithItems, CompanyPhase } from "@/services/CompanyGapTemplateService";
import { useGapAnalysisSync } from "@/hooks/useGapAnalysisSync";
import { getCompanyConditions } from "@/services/gapAutoEnableService";
import { toast } from "sonner";

export function useCompanyGapTemplates(companyId: string) {
  const [companyTemplates, setCompanyTemplates] = useState<CompanyGapTemplate[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<GapTemplateWithItems[]>([]);
  const [companyPhases, setCompanyPhases] = useState<CompanyPhase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { syncAfterTemplateChange } = useGapAnalysisSync();

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const [company, available, phases, conditions] = await Promise.all([
        CompanyGapTemplateService.getCompanyTemplates(companyId),
        CompanyGapTemplateService.getAvailableTemplates(),
        CompanyGapTemplateService.getCompanyPhases(companyId),
        getCompanyConditions(companyId)
      ]);
      
      setCompanyTemplates(company);
      setAvailableTemplates(available);
      setCompanyPhases(phases);

      // Auto-enable templates whose auto_enable_condition matches company products
      const enabledIds = new Set(company.filter(ct => ct.is_enabled).map(ct => ct.template_id));
      const existingIds = new Set(company.map(ct => ct.template_id));
      
      const templatesToAutoEnable = available.filter((t: any) => {
        const condition = t.auto_enable_condition;
        if (!condition) return false; // null = fully manual
        if (!conditions.has(condition)) return false; // condition not met
        // Only auto-enable if no row exists yet (don't override manual disables, except for 'always')
        if (condition === 'always') return !enabledIds.has(t.id);
        return !existingIds.has(t.id);
      });

      if (templatesToAutoEnable.length > 0) {
        await Promise.all(
          templatesToAutoEnable.map(t => CompanyGapTemplateService.enableTemplate(companyId, t.id))
        );
        const updatedCompany = await CompanyGapTemplateService.getCompanyTemplates(companyId);
        setCompanyTemplates(updatedCompany);
        // Sync gap items for newly enabled templates in background
        templatesToAutoEnable.forEach(t => {
          syncAfterTemplateChange(companyId, t.id, true).catch(console.error);
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load gap analysis templates');
    } finally {
      setIsLoading(false);
    }
  };

  const enableTemplate = async (templateId: string, onProgress?: (current: number, total: number, meta?: { devices: number; requirements: number }) => void) => {
    try {
      await CompanyGapTemplateService.enableTemplate(companyId, templateId);
      await syncAfterTemplateChange(companyId, templateId, true, onProgress);
      // Refresh in background — don't block the progress dialog
      loadTemplates().catch(console.error);
    } catch (error) {
      console.error('Error enabling template:', error);
      toast.error('Failed to enable template');
    }
  };

  const disableTemplate = async (templateId: string) => {
    try {
      await CompanyGapTemplateService.disableTemplate(companyId, templateId);
      await syncAfterTemplateChange(companyId, templateId, false);
      await loadTemplates();
      toast.success('Template disabled and gap analysis items removed');
    } catch (error) {
      console.error('Error disabling template:', error);
      toast.error('Failed to disable template');
    }
  };

  const updateTemplateNotes = async (templateId: string, notes: string) => {
    try {
      await CompanyGapTemplateService.updateTemplateNotes(companyId, templateId, notes);
      await loadTemplates();
      toast.success('Template notes updated');
    } catch (error) {
      console.error('Error updating template notes:', error);
      toast.error('Failed to update template notes');
    }
  };

  const getTemplateStatus = (templateId: string) => {
    const companyTemplate = companyTemplates.find(ct => ct.template_id === templateId);
    return companyTemplate ? companyTemplate.is_enabled : false;
  };

  const getTemplateRequirementCount = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    return template?.checklistItems?.length || 0;
  };

  const updateTemplateScope = async (templateId: string, scope: 'company' | 'product') => {
    try {
      await CompanyGapTemplateService.updateTemplateScope(templateId, scope);
      await loadTemplates();
      toast.success('Template scope updated successfully');
    } catch (error) {
      console.error('Error updating template scope:', error);
      toast.error('Failed to update template scope');
    }
  };

  const updateTemplatePhases = async (templateId: string, phaseIds: string[]) => {
    try {
      await CompanyGapTemplateService.updateTemplatePhases(templateId, phaseIds);
      await loadTemplates();
      toast.success('Template phases updated successfully');
    } catch (error) {
      console.error('Error updating template phases:', error);
      toast.error('Failed to update template phases');
    }
  };

  const getTemplatePhaseDisplay = (template: any) => {
    return CompanyGapTemplateService.formatPhaseDisplay(template, companyPhases);
  };

  const getTemplatePhases = (template: any) => {
    return CompanyGapTemplateService.getTemplatePhases(template);
  };

  useEffect(() => {
    if (companyId) {
      loadTemplates();
    }
  }, [companyId]);

  return {
    companyTemplates,
    availableTemplates,
    companyPhases,
    isLoading,
    loadTemplates,
    enableTemplate,
    disableTemplate,
    updateTemplateNotes,
    updateTemplateScope,
    updateTemplatePhases,
    getTemplateStatus,
    getTemplateRequirementCount,
    getTemplatePhaseDisplay,
    getTemplatePhases
  };
}
