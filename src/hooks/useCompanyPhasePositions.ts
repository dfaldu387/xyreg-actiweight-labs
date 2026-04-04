import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface PhasePosition {
  id: string;
  name: string;
  position: number;
}

export function useCompanyPhasePositions(companyId: string) {
  const [phasePositions, setPhasePositions] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const loadPhasePositions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch phase positions from company_chosen_phases table
        const { data, error: phasesError } = await supabase
          .from('company_chosen_phases')
          .select(`
            position,
            company_phases!inner(id, name)
          `)
          .eq('company_id', companyId)
          .order('position');

        if (phasesError) throw phasesError;

        // Create a map of phase name to position
        const positionMap = new Map<string, number>();
        
        (data || []).forEach(item => {
          const phase = item.company_phases as any;
          if (phase && phase.name) {
            positionMap.set(phase.name, item.position);
          }
        });

        setPhasePositions(positionMap);
      } catch (err) {
        console.error('Error loading phase positions:', err);
        setError('Failed to load phase positions');
      } finally {
        setLoading(false);
      }
    };

    loadPhasePositions();
  }, [companyId]);

  const getPhasePosition = (phaseName: string): number => {
    // "No Phase" (SOPs) always sorted last
    if (!phaseName || phaseName === 'No Phase') return 99999;
    return phasePositions.get(phaseName) ?? 999;
  };

  return {
    phasePositions,
    getPhasePosition,
    loading,
    error
  };
}
