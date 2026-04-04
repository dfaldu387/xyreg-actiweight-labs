import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export interface CompanyActivePhase {
  id: string;
  name: string;
  position: number;
  description?: string;
  category_id?: string;
  company_id: string;
  is_active: boolean;
  is_predefined_core_phase: boolean;
  start_date?: string;
  duration_days?: number;
  is_continuous_process?: boolean;
}

/**
 * Fetches active phases for a company.
 * Uses React Query for caching to prevent duplicate API calls across components.
 */
export function useCompanyActivePhases(companyId: string | null) {
  const { data: activePhases = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['company-active-phases', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Get active phases from company_chosen_phases - exact same query as company settings
      const { data: activePhasesRaw, error: activePhasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            category_id,
            sub_section_id,
            company_id,
            position,
            is_active,
            start_date,
            duration_days,
            is_continuous_process,
            phase_categories:category_id(
              id,
              name,
              is_system_category
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (activePhasesError) throw activePhasesError;

      // Map active phases exactly as company settings does
      const phases: CompanyActivePhase[] = (activePhasesRaw || [])
        .map(cp => {
          const category = cp.company_phases.phase_categories;
          const isSystemPhase = category?.is_system_category === true;

          return {
            id: cp.company_phases.id,
            name: cp.company_phases.name,
            description: cp.company_phases.description,
            category_id: cp.company_phases.category_id,
            sub_section_id: (cp.company_phases as any).sub_section_id || null,
            company_id: cp.company_phases.company_id,
            position: cp.position, // This is the position from company_chosen_phases
            is_active: cp.company_phases.is_active,
            is_predefined_core_phase: isSystemPhase,
            start_date: cp.company_phases.start_date,
            duration_days: cp.company_phases.duration_days,
            is_continuous_process: cp.company_phases.is_continuous_process,
          };
        })
        .sort((a, b) => a.position - b.position); // Sort by position in ascending order

      return phases;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const error = queryError ? 'Failed to load active phases' : null;

  const getPhasePosition = (phaseName: string): number => {
    const phase = activePhases.find(p => p.name === phaseName);
    return phase?.position ?? 999; // Default to high number for phases without position
  };

  const getPhaseByName = (phaseName: string): CompanyActivePhase | undefined => {
    return activePhases.find(p => p.name === phaseName);
  };

  return {
    activePhases,
    getPhasePosition,
    getPhaseByName,
    loading,
    error
  };
}