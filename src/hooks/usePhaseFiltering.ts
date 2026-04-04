
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FilterablePhase {
  id: string;
  name: string;
  isActive: boolean;
  position: number;
  documentCount: number;
}

export function usePhaseFiltering(companyId: string) {
  const [phases, setPhases] = useState<FilterablePhase[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setPhases([]);
      setIsLoading(false);
      return;
    }

    loadPhases();
  }, [companyId]);

  const loadPhases = async () => {
    setIsLoading(true);
    try {
      // Get company phases - FIXED: Use company_phases
      const { data: activePhases, error: activePhasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (activePhasesError) {
        throw activePhasesError;
      }

      // Get document counts for each phase
      const phaseData: FilterablePhase[] = [];
      
      for (const phaseInfo of activePhases || []) {
        const phase = phaseInfo.company_phases;
        
        const { data: documents } = await supabase
          .from('phase_assigned_documents')
          .select('id')
          .eq('phase_id', phase.id);

        phaseData.push({
          id: phase.id,
          name: phase.name,
          isActive: true,
          position: phaseInfo.position,
          documentCount: documents?.length || 0
        });
      }

      setPhases(phaseData);
      setSelectedPhases(phaseData.map(p => p.id)); // Select all by default

    } catch (error) {
      console.error('Error loading phases for filtering:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setSelectedPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const selectAllPhases = () => {
    setSelectedPhases(phases.map(p => p.id));
  };

  const clearAllPhases = () => {
    setSelectedPhases([]);
  };

  const filteredPhases = useMemo(() => {
    return phases.filter(phase => selectedPhases.includes(phase.id));
  }, [phases, selectedPhases]);

  return {
    phases,
    selectedPhases,
    filteredPhases,
    isLoading,
    togglePhase,
    selectAllPhases,
    clearAllPhases,
    refreshPhases: loadPhases
  };
}
