import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ComplianceSection, complianceSectionService } from '@/services/complianceSectionService';
import { useAuth } from '@/context/AuthContext';

interface UseComplianceSectionsOptions {
  enabled?: boolean;
  phaseId?: string;
}

export function useComplianceSections(companyId?: string, options: UseComplianceSectionsOptions = {}) {
  const { enabled = true, phaseId } = options;
  const queryClient = useQueryClient();
  const queryKey = phaseId
    ? ['compliance-sections', companyId, 'phase', phaseId]
    : ['compliance-sections', companyId];
  const { user } = useAuth();

  const {
    data: sections = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ComplianceSection[]>({
    queryKey,
    queryFn: async () => {
      if (!companyId) return [];
      if (phaseId) {
        return await complianceSectionService.getPhaseSections(phaseId);
      }
      return await complianceSectionService.getCompanySections(companyId);
    },
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const upsertIntoCache = (updater: (current: ComplianceSection[]) => ComplianceSection[]) => {
    queryClient.setQueryData<ComplianceSection[]>(queryKey, (current = []) => updater(current));
  };

  const createSection = async (name: string, targetPhaseId?: string): Promise<ComplianceSection | null> => {
    if (!companyId || !user?.id) {
      return null;
    }

    const newSection = await complianceSectionService.createSection(
      companyId,
      name,
      user.id,
      user.id,
      targetPhaseId || phaseId
    );

    if (newSection) {
      upsertIntoCache((current) => [...current, newSection].sort((a, b) => a.name.localeCompare(b.name)));
      // Also invalidate the company-level sections cache
      if (phaseId || targetPhaseId) {
        queryClient.invalidateQueries({ queryKey: ['compliance-sections', companyId] });
      }
    }

    return newSection;
  };

  const getOrCreateSection = async (name: string, targetPhaseId?: string): Promise<ComplianceSection | null> => {
    if (!companyId || !user?.id) {
      return null;
    }

    const section = await complianceSectionService.getOrCreateSection(
      companyId,
      name,
      user.id,
      user.id,
      targetPhaseId || phaseId
    );

    if (section) {
      // Check if already in cache
      const existingInCache = sections.find(s => s.id === section.id);
      if (!existingInCache) {
        upsertIntoCache((current) => [...current, section].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    return section;
  };

  const updateSection = async (sectionId: string, name: string): Promise<boolean> => {
    const success = await complianceSectionService.updateSection(sectionId, { name });

    if (success) {
      upsertIntoCache((current) =>
        current.map((s) => (s.id === sectionId ? { ...s, name } : s)).sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    return success;
  };

  const deleteSection = async (sectionId: string): Promise<boolean> => {
    const success = await complianceSectionService.deleteSection(sectionId);

    if (success) {
      upsertIntoCache((current) => current.filter((section) => section.id !== sectionId));
    }

    return success;
  };

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : String(error)
    : null;

  return {
    sections,
    isLoading,
    isFetching,
    error: errorMessage,
    refetch,
    createSection,
    getOrCreateSection,
    updateSection,
    deleteSection,
  };
}
